import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { IsPublicKey } from '../middleware/public-key-validation';

export class UnicastMessageCommandDto {
  @IsString()
  title!: string;
  @IsString()
  message!: string;
  @IsPublicKey()
  recipientPublicKey!: string;
  @IsUUID()
  @IsOptional()
  notificationTypeId?: string;
}

export class MulticastMessageCommandDto {
  @IsString()
  title!: string;
  @IsString()
  message!: string;
  @IsArray()
  @ArrayNotEmpty()
  @IsPublicKey({ each: true })
  recipientPublicKeys!: string[];
  @IsUUID()
  @IsOptional()
  notificationTypeId?: string;
}

export class BroadcastMessageCommandDto {
  @IsString()
  title!: string;
  @IsString()
  message!: string;
  @IsUUID()
  @IsOptional()
  notificationTypeId?: string;
}

export class DappResourceId {
  @IsPublicKey()
  readonly dappPublicKey!: string;
}
