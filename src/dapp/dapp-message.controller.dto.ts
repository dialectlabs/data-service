import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';
import { IsPublicKey } from '../middleware/public-key-validation';

export class UnicastMessageCommandDto {
  @IsString()
  title!: string;
  @IsString()
  message!: string;
  @IsPublicKey()
  recipientPublicKey!: string;
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
}

export class BroadcastMessageCommandDto {
  @IsString()
  title!: string;
  @IsString()
  message!: string;
}

export class DappResourceId {
  @IsPublicKey()
  readonly dappPublicKey!: string;
}
