import { Dialect, Member, Message, Wallet } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { getDialectProgramAddress } from '@dialectlabs/web3';
import { PublicKey } from '@solana/web3.js';
import { PostMemberDto } from './dialect.controller.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

//
// Extended query types. TODO: Move to types or utils file
//

export type WalletedMember = Member & {
  wallet: Wallet;
};

export type MemberedMessage = Message & {
  member: WalletedMember;
};

export type MemberedAndMessagedDialect = Dialect & {
  members: WalletedMember[];
  messages: MemberedMessage[];
};

export type DialectedMember = Member & {
  dialect: MemberedAndMessagedDialect;
};

const DIALECTED_MEMBER_INCLUDES = {
  dialect: {
    include: {
      members: {
        include: {
          wallet: true,
        },
      },
      // TODO: Limit to last N messages, sorted.
      messages: {
        include: {
          member: {
            include: {
              wallet: true,
            },
          },
        },
      },
    },
  },
};

export async function findAllDialects(
  prisma: PrismaService,
  wallet: Wallet,
): Promise<MemberedAndMessagedDialect[]> {
  // Fetch dialects for member. We do this via the members since includes are trivial.
  const members: DialectedMember[] = await prisma.member.findMany({
    where: {
      walletId: wallet.id,
    },
    include: DIALECTED_MEMBER_INCLUDES,
  });

  // TODO: confirm dialects are already unique & rm filter.
  const dialects: MemberedAndMessagedDialect[] = members
    .map((m: DialectedMember) => m.dialect)
    .filter(
      (dialect: Dialect, idx: number, dialects_: Dialect[]) =>
        dialects_.indexOf(dialect) === idx,
    );
  return dialects;
}

export async function findDialect(
  prisma: PrismaService,
  wallet: Wallet,
  dialectPublicKey: string,
): Promise<MemberedAndMessagedDialect | null> {
  const members: DialectedMember[] = await prisma.member.findMany({
    where: {
      walletId: wallet.id,
      dialect: {
        publicKey: dialectPublicKey,
      },
    },
    include: DIALECTED_MEMBER_INCLUDES,
  });
  if (members.length == 0) return null;
  if (members.length > 0)
    throw new Error(
      'More than one member found for a wallet and dialect public key.',
    );
  const dialect = members[0].dialect;
  return dialect;
}

export async function postDialect(
  prisma: PrismaService,
  members: [PostMemberDto, PostMemberDto],
  encrypted: boolean,
): Promise<Dialect> {
  // Validate member public keys, upsert wallets
  members.map(async (m: PostMemberDto) => {
    try {
      new PublicKey(m.publicKey);
    } catch {
      // TODO: Make custom error class here, use HttpException in controller instead.
      throw new HttpException(
        `Cannot create dialect. Member supplied with invalid public key ${m.publicKey}.`,
        HttpStatus.BAD_REQUEST,
      );
    }
  });
  const wallets = await Promise.all(
    members.map(async (m: PostMemberDto): Promise<Wallet> => {
      const wallet = await prisma.wallet.upsert({
        where: {
          publicKey: m.publicKey,
        },
        create: {
          publicKey: m.publicKey,
        },
        update: {},
      });
      return wallet;
    }),
  );

  // TODO: implement
  // const [publicKey, nonce]: [PublicKey, number] =
  //   await getDialectProgramAddress(program, members);

  const [ publicKey, nonce ]: [PublicKey, number] = await getDialectProgramAddress(program, members);
  const dialect = await prisma.dialect.create({
    data: {
      publicKey: publicKey.toBase58(),
      encrypted,
    },
  });

  await Promise.all(
    members.map(async (m: PostMemberDto, idx: number) => {
      await postMember(prisma, dialect, m, wallets[idx]);
    }),
  );

  return dialect;
}

async function postMember(
  prisma: PrismaService,
  dialect: Dialect,
  member: PostMemberDto,
  wallet: Wallet,
): Promise<Member> {
  const member_ = await prisma.member.create({
    data: {
      dialectId: dialect.id,
      walletId: wallet.id,
      scopes: member.scopes,
    },
  });
  return member_;
}

export async function postMessage(
  prisma: PrismaService,
  member: Member,
  dialectId: string,
  text: Buffer,
): Promise<Message> {
  const timestamp = new Date();
  const message = await prisma.message.create({
    data: {
      dialectId,
      memberId: member.id,
      text,
      timestamp,
    },
  });
  return message;
}

export async function deleteDialect(
  prisma: PrismaService,
  wallet: Wallet,
  publicKey: string,
): Promise<void> {
  const dialect = await findDialect(prisma, wallet, publicKey);
  if (!dialect)
    throw new HttpException(
      `No Dialect ${publicKey} found for Wallet ${wallet.publicKey}, cannot delete.`,
      HttpStatus.BAD_REQUEST,
    );
  if (
    !dialect.members.some(
      (m: WalletedMember) =>
        m.wallet.publicKey === wallet.publicKey && m.scopes[1],
    )
  )
    throw new HttpException(
      `Wallet ${wallet.publicKey} does not have admin privileges, cannot delete Dialect.`,
      HttpStatus.UNAUTHORIZED,
    );
  await prisma.dialect.delete({
    where: {
      id: dialect.id,
    },
  });
}
