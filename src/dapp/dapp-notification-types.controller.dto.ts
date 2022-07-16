import {
  IsArray,
  IsNumber,
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
  @IsString()
  @IsOptional()
  humanReadableId?: string;
  @IsString()
  @IsOptional()
  trigger?: string;
  @IsNumber()
  @IsOptional()
  orderingPriority?: number;
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
  humanReadableId!: string;
  @IsString()
  @IsOptional()
  trigger?: string;
  @IsNumber()
  @IsOptional()
  orderingPriority?: number;
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
  @ValidateNested()
  defaultConfig!: NotificationConfigDto;
}
