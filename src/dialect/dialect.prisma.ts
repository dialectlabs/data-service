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

export const DIALECT_INCLUDES = {
  members: {
    include: {
      wallet: true,
    },
  },
  messages: {
    include: {
      member: {
        include: {
          wallet: true,
        },
      },
    },
  },
};
