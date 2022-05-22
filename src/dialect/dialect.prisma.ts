import { Dialect, Member, Message, Wallet } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

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

export async function findAllDialects(prisma: PrismaService, wallet: Wallet): Promise<MemberedAndMessagedDialect[]> {
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
      dialects_.indexOf(dialect) === idx);
  return dialects;
}

export async function findDialect(prisma: PrismaService, wallet: Wallet, dialectPublicKey: string): Promise<MemberedAndMessagedDialect | null> {
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
  if (members.length > 0) throw new Error('More than one member found for a wallet and dialect public key.');
  const dialect = members[0].dialect;
  return dialect;
}

export async function postMessage(prisma: PrismaService, member: Member, dialectId: string, text: Buffer): Promise<Message> {
  const timestamp = new Date()
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