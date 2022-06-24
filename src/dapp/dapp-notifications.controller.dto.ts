import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';
import { IsPublicKey } from '../middleware/public-key-validation';

export class UnicastNotificationCommandDto {
  @IsString()
  title!: string;
  @IsString()
  message!: string;
  @IsPublicKey()
  receiverPublicKey!: string;
}

export class MulticastNotificationCommandDto {
  @IsString()
  title!: string;
  @IsString()
  message!: string;
  @IsArray()
  @ArrayNotEmpty()
  @IsPublicKey({ each: true })
  receiverPublicKeys!: string[];
}

export class BroadcastNotificationCommandDto {
  @IsString()
  title!: string;
  @IsString()
  message!: string;
}
