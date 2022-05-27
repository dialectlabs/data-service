import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  DIALECT_INCLUDES,
  DIALECTED_MEMBER_INCLUDES,
  DialectedMember,
  MemberedAndMessagedDialect,
  WalletedMember,
} from './dialect.prisma';
import { Dialect, Scope, Wallet } from '@prisma/client';
import {
  CreateDialectCommandDto,
  DialectMemberDto,
  MemberScopeDto,
} from './dialect.controller.dto';
import { PublicKey } from '@solana/web3.js';
import { WalletService } from '../wallet/wallet.service';
import { DialectAddressProvider } from './dialect-address-provider';
import _ from 'lodash';

@Injectable()
export class DialectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
  ) {}

  async findAll(wallet: Wallet): Promise<MemberedAndMessagedDialect[]> {
    // Fetch dialects for member. We do this via the members since includes are trivial.
    const members: DialectedMember[] = await this.prisma.member.findMany({
      where: {
        walletId: wallet.id,
      },
      include: DIALECTED_MEMBER_INCLUDES,
    });
    // TODO: confirm dialects are already unique & rm filter.
    return members
      .map((m: DialectedMember) => m.dialect)
      .filter(
        (dialect: Dialect, idx: number, dialects_: Dialect[]) =>
          dialects_.indexOf(dialect) === idx,
      );
  }

  async find(
    publicKey: string,
    wallet: Wallet,
  ): Promise<MemberedAndMessagedDialect | null> {
    return this.prisma.dialect.findFirst({
      where: {
        publicKey,
        members: {
          some: {
            walletId: wallet.id,
          },
        },
      },
      include: DIALECT_INCLUDES,
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
      include: DIALECT_INCLUDES,
    });
  }

  async delete(publicKey: string, wallet: Wallet) {
    const dialect = await this.find(publicKey, wallet);
    if (!dialect)
      throw new NotFoundException(
        `No Dialect ${publicKey} found for Wallet ${wallet.publicKey}, cannot delete.`,
      );
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
      (it) => it === MemberScopeDto.Admin,
    );
    if (!walletMemberIsAdmin) {
      throw new UnprocessableEntityException(
        'Must be an admin of created dialect',
      );
    }
  }
}
