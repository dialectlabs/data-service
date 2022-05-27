import { Dialect, Member, Message, Wallet } from '@prisma/client';

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
