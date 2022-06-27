import { PrismaService } from '../prisma/prisma.service';
import {
  ForbiddenException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  DIALECT_INCLUDES,
  MemberedAndMessagedDialect,
  WalletedMember,
} from './dialect.prisma';
import { Member, Message, Scope, Wallet } from '@prisma/client';
import {
  CreateDialectCommandDto,
  DialectMemberDto,
  MemberScopeDto,
} from './dialect.controller.dto';
import { PublicKey } from '@solana/web3.js';
import { DialectAddressProvider } from './dialect-address-provider';
import _ from 'lodash';
import { Principal } from '../auth/authenticaiton.decorator';

const DEFAULT_MESSAGES_PAGE_SIZE = 50;

export interface FindDialectQuery {
  publicKey?: string;
  someMemberWalletId?: string;
  memberWalletPublicKeys?: string[];
  encrypted?: boolean;
}

@Injectable()
export class DialectService {
  constructor(private readonly prisma: PrismaService) {}

  async findOneFailFast(
    query: FindDialectQuery,
  ): Promise<MemberedAndMessagedDialect> {
    const dialect = await this.findOneFailSafe(query);
    if (!dialect) {
      throw new UnprocessableEntityException(
        `Cannot find dialect using given query: ${JSON.stringify(query)}`,
      );
    }
    return dialect;
  }

  async findOneFailSafe(
    query: FindDialectQuery,
  ): Promise<MemberedAndMessagedDialect | null> {
    const dialects = await this.findAll(query);
    if (dialects.length > 1) {
      throw new UnprocessableEntityException(
        `Expected single dialect for given parameters.`,
      );
    }
    return dialects[0] ?? null;
  }

  async findAll(
    query: FindDialectQuery,
  ): Promise<MemberedAndMessagedDialect[]> {
    return this.prisma.dialect.findMany({
      where: {
        ...(query.publicKey && { publicKey: query.publicKey }),
        ...(query.encrypted && { encrypted: query.encrypted }),
        ...(query.someMemberWalletId && {
          members: {
            some: {
              walletId: query.someMemberWalletId,
            },
          },
        }),
        ...(query.memberWalletPublicKeys && {
          members: {
            every: {
              wallet: {
                publicKey: {
                  in: query.memberWalletPublicKeys,
                },
              },
            },
          },
        }),
      },
      include: {
        ...DIALECT_INCLUDES,
        messages: {
          ...DIALECT_INCLUDES.messages,
          orderBy: {
            timestamp: 'desc',
          },
          take: 50,
        },
      },
    });
  }

  async create(
    command: CreateDialectCommandDto,
    wallet: Wallet,
  ): Promise<MemberedAndMessagedDialect> {
    this.validateCreateDialectCommand(command, wallet);
    const { members, encrypted } = command;
    const membersWithWallets = await this.getMemberWallets(members);
    const dialectAddress = await DialectAddressProvider.getAddress(
      membersWithWallets.map((it) => new PublicKey(it.publicKey)),
    );
    return this.prisma.dialect.create({
      data: {
        publicKey: dialectAddress.toBase58(),
        encrypted,
        members: {
          createMany: {
            data: membersWithWallets.map(({ id: walletId, scopes }) => ({
              scopes,
              walletId,
            })),
          },
        },
      },
      include: {
        ...DIALECT_INCLUDES,
        messages: {
          ...DIALECT_INCLUDES.messages,
          orderBy: {
            timestamp: 'desc',
          },
          take: DEFAULT_MESSAGES_PAGE_SIZE,
        },
      },
    });
  }

  async delete(publicKey: string, wallet: Wallet) {
    const dialect = await this.findOneFailFast({
      publicKey,
      someMemberWalletId: wallet.id,
    });
    if (
      !dialect.members.find(
        (m: WalletedMember) =>
          m.walletId === wallet.id && m.scopes.find((it) => it === Scope.ADMIN),
      )
    ) {
      throw new ForbiddenException(
        `Wallet ${wallet.publicKey} does not have admin privileges, cannot delete Dialect.`,
      );
    }
    await this.prisma.dialect.delete({
      where: {
        id: dialect.id,
      },
    });
  }

  async sendMessage(
    text: Buffer,
    findDialectQuery: FindDialectQuery,
    principal: Principal,
  ): Promise<MemberedAndMessagedDialect> {
    const dialect = await this.findOneFailFast(findDialectQuery);
    const canWrite = this.checkWalletCanWriteTo(principal.wallet, dialect);
    await this.saveMessage(canWrite, dialect.id, text);
    return this.findOneFailFast(findDialectQuery);
  }

  private checkWalletCanWriteTo(
    wallet: Wallet,
    dialect: MemberedAndMessagedDialect,
  ) {
    const canWrite = dialect.members.find(
      (m) =>
        m.wallet.publicKey === wallet.publicKey &&
        m.scopes.find((it) => it === Scope.WRITE),
    );
    if (!canWrite)
      throw new ForbiddenException(
        `Wallet ${wallet.publicKey} does not have write privileges to Dialect ${dialect.publicKey}.`,
      );
    return canWrite;
  }

  async saveMessage(
    member: Member,
    dialectId: string,
    text: Buffer,
  ): Promise<Message> {
    const timestamp = new Date();
    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          dialectId,
          memberId: member.id,
          text,
          timestamp,
        },
      }),
      this.prisma.dialect.update({
        where: {
          id: dialectId,
        },
        data: {
          updatedAt: timestamp,
        },
      }),
    ]);
    return message;
  }

  private async getMemberWallets(members: DialectMemberDto[]) {
    const memberPublicKeys = members.map((it) => new PublicKey(it.publicKey));
    const memberWallets = await this.upsert(...memberPublicKeys);
    return _.values(
      _.merge(
        _.keyBy(members, (it) => it.publicKey),
        _.keyBy(memberWallets, (it) => it.publicKey),
      ),
    );
  }

  private validateCreateDialectCommand(
    { members }: CreateDialectCommandDto,
    wallet: Wallet,
  ) {
    this.checkWalletIsAdmin(wallet, members);
  }

  private checkWalletIsAdmin(wallet: Wallet, members: DialectMemberDto[]) {
    const walletMember = members.find(
      ({ publicKey }) => publicKey === wallet.publicKey,
    );
    if (!walletMember) {
      throw new ForbiddenException('Must be a member of created dialect');
    }
    const walletMemberIsAdmin = walletMember.scopes.some(
      (it) => it === MemberScopeDto.ADMIN,
    );
    if (!walletMemberIsAdmin) {
      throw new UnprocessableEntityException(
        'Must be an admin of created dialect',
      );
    }
  }

  private async upsert(...publicKeys: PublicKey[]) {
    return this.prisma.$transaction(
      publicKeys.map((publicKey) =>
        this.prisma.wallet.upsert({
          where: {
            publicKey: publicKey.toBase58(),
          },
          create: {
            publicKey: publicKey.toBase58(),
          },
          update: {},
        }),
      ),
    );
  }
}
