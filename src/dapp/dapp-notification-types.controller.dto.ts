import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { NotificationConfigDto } from '../notification/notification.dto';

export class NotificationTypeResourceId {
  @IsUUID(4)
  readonly notificationTypeId!: string;
}

export class PatchNotificationTypeCommandDto {
  @IsOptional()
  @IsString()
  name?: string;
  @IsOptional()
  @IsString()
  code?: string;
  @IsOptional()
  @IsString()
  description?: string;
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
  @IsOptional()
  @ValidateNested()
  defaultConfig?: NotificationConfigDto;
}

export class CreateNotificationTypeCommandDto {
  @IsString()
  name!: string;
  @IsString()
  code!: string;
  @IsString()
  description!: string;
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
  @ValidateNested()
  defaultConfig!: NotificationConfigDto;
}
