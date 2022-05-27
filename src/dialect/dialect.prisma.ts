import { Dialect, Member, Message, Wallet } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
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

export const DIALECT_INCLUDES = {
  members: {
    include: {
      wallet: true,
    },
  },
  // TODO: Limit to last N messages, sorted.
  messages: {
    // orderBy: {
    //   timestamp: 'desc',
    // },
    // take: 50,
    include: {
      member: {
        include: {
          wallet: true,
        },
      },
    },
  },
};
export const DIALECTED_MEMBER_INCLUDES = {
  dialect: {
    include: DIALECT_INCLUDES,
  },
};

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
