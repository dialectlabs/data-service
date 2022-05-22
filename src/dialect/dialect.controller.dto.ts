import { Dialect, Member, Message, Wallet } from '@prisma/client';

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

export class DialectAccountDto {
  readonly publicKey!: string;
  readonly dialect!: DialectDto;

  static fromDialect(dialect: MemberedAndMessagedDialect) {
    return {
      publicKey: dialect.publicKey,
      dialect: DialectDto.fromDialect(dialect),
    } as DialectAccountDto;
  }
};

//
// DTO types
//

export class DialectDto {
  readonly members!: MemberDto[];
  readonly messages!: MessageDto[];
  // N.b. nextMessageIdx & lastMessageTimestamp are added only so we have schema parity with what's on chain.
  readonly nextMessageIdx!: number;
  readonly lastMessageTimestamp!: number;
  readonly encrypted!: boolean;

  static fromDialect(dialect: MemberedAndMessagedDialect) {
    return {
      members: dialect.members.map(MemberDto.fromMember),
      messages: dialect.messages.map(MessageDto.fromMessage),
      nextMessageIdx: 0,
      lastMessageTimestamp: 0,
      encrypted: dialect.encrypted,
    } as DialectDto;
  }
};

export class MemberDto {
  readonly publicKey!: string;
  readonly scopes!: [boolean, boolean];

  static fromMember(member: WalletedMember) {
    return {
      publicKey: member.wallet.publicKey,
      scopes: member.scopes,
    } as MemberDto;
  }
};

export class MessageDto {
  readonly owner!: string;
  readonly text!: Buffer;
  readonly timestamp!: number;

  static fromMessage(message: MemberedMessage) {
    return {
      owner: message.member.wallet.publicKey,
      text: message.text,
      timestamp: message.timestamp.getTime(),
    } as MessageDto;
  }
};
