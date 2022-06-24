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
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsPublicKey } from '../middleware/public-key-validation';

//
// DTO types
//
export class DialectResourceId {
  @IsPublicKey()
  readonly dialectPublicKey!: string;
}
export class DialectAccountDto {
  readonly publicKey!: string;
  readonly dialect!: DialectDto;

  static fromDialect(dialect: MemberedAndMessagedDialect): DialectAccountDto {
    return {
      publicKey: dialect.publicKey,
      dialect: DialectDto.fromDialect(dialect),
    };
  }
}

export class DialectDto {
  readonly members!: MemberDto[];
  readonly messages!: MessageDto[];
  // N.b. nextMessageIdx & lastMessageTimestamp are added only so we have schema parity with what's on chain.
  readonly nextMessageIdx!: number;
  readonly lastMessageTimestamp!: number;
  readonly encrypted!: boolean;

  static fromDialect(dialect: MemberedAndMessagedDialect): DialectDto {
    return {
      members: dialect.members.map(MemberDto.fromMember),
      messages: dialect.messages.map(MessageDto.fromMessage),
      nextMessageIdx: 0,
      lastMessageTimestamp: dialect.updatedAt.getTime(),
      encrypted: dialect.encrypted,
    };
  }
}

export class MemberDto {
  readonly publicKey!: string;
  readonly scopes!: MemberScopeDto[];

  static fromMember(member: WalletedMember): MemberDto {
    return {
      publicKey: member.wallet.publicKey,
      scopes: member.scopes.map((it) => MemberScopeDto[it]),
    };
  }
}

export class MessageDto {
  readonly owner!: string;
  readonly text!: number[];
  readonly timestamp!: number;

  static fromMessage(message: MemberedMessage): MessageDto {
    return {
      owner: message.member.wallet.publicKey,
      text: Array.from(new Uint8Array(message.text)),
      timestamp: message.timestamp.getTime(),
    };
  }
}

export enum MemberScopeDto {
  ADMIN = 'ADMIN',
  WRITE = 'WRITE',
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

export class SendMessageCommandDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(1024)
  readonly text!: number[];
}

export class FindDialectQueryDto {
  @IsPublicKey()
  @IsOptional()
  readonly memberPublicKey?: string;
}
