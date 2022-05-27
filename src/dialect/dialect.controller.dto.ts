import {
  MemberedAndMessagedDialect,
  MemberedMessage,
  WalletedMember,
} from './dialect.prisma';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsPublicKey } from '../middleware/public-key-validation';

//
// DTO types
//

export class DialectAccountDto {
  readonly publicKey!: string;
  readonly dialect!: DialectDto;

  static fromDialect(dialect: MemberedAndMessagedDialect) {
    return {
      publicKey: dialect.publicKey,
      dialect: DialectDto.fromDialect(dialect),
    } as DialectAccountDto;
  }
}

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
}

export class MemberDto {
  readonly publicKey!: string;
  readonly scopes!: MemberScopeDto[];

  static fromMember(member: WalletedMember) {
    return {
      publicKey: member.wallet.publicKey,
      scopes: member.scopes,
    } as MemberDto;
  }
}

export class MessageDto {
  readonly owner!: string;
  readonly text!: Buffer;
  readonly timestamp!: number;

  static fromMessage(message: MemberedMessage): MessageDto {
    return {
      owner: message.member.wallet.publicKey,
      text: message.text,
      timestamp: message.timestamp.getTime(),
    };
  }
}

export enum MemberScopeDto {
  Admin = 'ADMIN',
  Write = 'WRITE',
}

export class CreateDialectCommandDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(2)
  @ArrayMinSize(2)
  @ArrayUnique((member) => member.publicKey)
  @ValidateNested({ each: true })
  @Type(() => DialectMemberDto)
  readonly members!: DialectMemberDto[];
  @IsBoolean()
  readonly encrypted!: boolean;
}

export class DialectMemberDto {
  @IsPublicKey()
  readonly publicKey!: string;
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique((scope) => scope)
  readonly scopes!: MemberScopeDto[];
}

export class PostMessageDto {
  readonly text!: Buffer;
}
