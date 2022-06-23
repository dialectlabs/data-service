import { IsOptional, IsString } from 'class-validator';

export class SendNotificationCommand {
  @IsOptional()
  @IsString()
  title?: string;
  @IsString()
  message!: string;
}
