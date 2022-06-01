import { Optional } from "@nestjs/common";

export class PostNotificationsDto {
  @Optional()
  readonly title!: string;
  readonly message!: string;
}

export class SubscriberDto {
  resourceId!: string;
  email?: string;
  telegramId?: string;
  smsNumber?: string;
}

