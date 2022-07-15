import { IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { IsPublicKey } from '../middleware/public-key-validation';
import { NotificationConfigDto } from '../notification/notification.dto';

export class FindNotificationSubscriptionQueryDto {
  @IsOptional()
  @IsPublicKey()
  readonly dappPublicKey?: string;
}

export class UpsertNotificationSubscriptionCommandDto {
  @IsPublicKey()
  readonly dappPublicKey!: string;
  @IsUUID(4)
  readonly notificationTypeId!: string;
  @ValidateNested()
  readonly config!: NotificationConfigDto;
}
