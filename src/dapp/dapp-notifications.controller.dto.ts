import { IsArray, IsString, ValidateNested } from 'class-validator';
import { IsPublicKey } from '../middleware/public-key-validation';

export class UnicastNotificationCommand {
  @IsString()
  title!: string;
  @IsString()
  message!: string;
  @IsPublicKey()
  receiverPublicKey!: string;
}

export class MulticastNotificationCommand {
  @IsString()
  title!: string;
  @IsString()
  message!: string;
  @IsArray()
  @ValidateNested({ each: true })
  @IsPublicKey()
  receiverPublicKeys!: string[];
}

export class BroadcastNotificationCommand {
  @IsString()
  title!: string;
  @IsString()
  message!: string;
}
