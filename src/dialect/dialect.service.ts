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
  SendMessageCommandDto,
} from './dialect.controller.dto';
import { PublicKey } from '@solana/web3.js';
import { WalletService } from '../wallet/wallet.service';
import { DialectAddressProvider } from './dialect-address-provider';
import _ from 'lodash';
import { Principal } from '../auth/authenticaiton.decorator';

const DEFAULT_MESSAGES_PAGE_SIZE = 50;

export interface FindDialectQuery {
  publicKey?: string;
  someMemberWalletId?: string;
  memberWalletPublicKeys?: string[];
}

@Injectable()
export class DialectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
  ) {}

  async findOne(query: FindDialectQuery): Promise<MemberedAndMessagedDialect> {
    const dialects = await this.findAll(query);
    if (dialects.length > 1) {
      throw new UnprocessableEntityException(
        `Expected single dialect for given parameters.`,
      );
    }
    return dialects[0];
  }

  async findAll(
    query: FindDialectQuery,
  ): Promise<MemberedAndMessagedDialect[]> {
    return this.prisma.dialect.findMany({
      where: {
        ...(query.publicKey && { publicKey: query.publicKey }),
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
    const dialect = await this.findOne({
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
    command: SendMessageCommandDto,
    findDialectQuery: FindDialectQuery,
    principal: Principal,
  ): Promise<MemberedAndMessagedDialect> {
    // TODO: Reduce includes in this query since less is needed.
    const text = command.text;
    const dialect = await this.findOne(findDialectQuery);
    const canWrite = this.checkWalletCanWriteTo(principal.wallet, dialect);
    await this.postMessage(canWrite, dialect.id, text);
    return this.findOne(findDialectQuery);
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

  async postMessage(
    member: Member,
    dialectId: string,
    text: number[],
  ): Promise<Message> {
    const timestamp = new Date();
    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          dialectId,
          memberId: member.id,
          text: Buffer.from(text),
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
    const memberWallets = await this.walletService.upsert(...memberPublicKeys);
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
}
