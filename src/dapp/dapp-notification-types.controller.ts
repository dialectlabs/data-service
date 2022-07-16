import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthenticationGuard } from '../auth/authentication.guard';
import {
  DappAuthPrincipal,
  DappPrincipal,
} from '../auth/authenticaiton.decorator';
import { DappResourceId } from './dapp.controller.dto';
import { checkPrincipalAuthorizedToUseDapp } from './dapp.service';
import { DappAuthenticationGuard } from '../auth/dapp-authentication.guard';
import { NotificationTypeDto } from '../notification/notification.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateNotificationTypeCommandDto,
  NotificationTypeResourceId,
  PatchNotificationTypeCommandDto,
} from './dapp-notification-types.controller.dto';

@ApiTags('Dapp notification types')
@Controller({
  path: 'dapps/:dappPublicKey/notificationTypes',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(AuthenticationGuard, DappAuthenticationGuard)
export class DappNotificationTypesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(
    @DappAuthPrincipal() principal: DappPrincipal,
    @Param() { dappPublicKey }: DappResourceId,
  ): Promise<NotificationTypeDto[]> {
    checkPrincipalAuthorizedToUseDapp(principal, dappPublicKey);
    const notificationTypes = await this.prisma.notificationType.findMany({
      where: {
        dappId: principal.dapp.id,
      },
    });
    return notificationTypes.map(NotificationTypeDto.fromDb);
  }

  @Get(':notificationTypeId')
  async findOne(
    @DappAuthPrincipal() principal: DappPrincipal,
    @Param() { dappPublicKey }: DappResourceId,
    @Param() { notificationTypeId }: NotificationTypeResourceId,
  ): Promise<NotificationTypeDto> {
    checkPrincipalAuthorizedToUseDapp(principal, dappPublicKey);
    const notificationType = await this.prisma.notificationType.findUnique({
      where: {
        dappId_id: {
          dappId: principal.dapp.id,
          id: notificationTypeId,
        },
      },
      rejectOnNotFound: (e) => new NotFoundException(e.message),
    });
    return NotificationTypeDto.fromDb(notificationType);
  }

  @Post()
  async create(
    @DappAuthPrincipal() principal: DappPrincipal,
    @Param() { dappPublicKey }: DappResourceId,
    @Body() command: CreateNotificationTypeCommandDto,
  ): Promise<NotificationTypeDto> {
    checkPrincipalAuthorizedToUseDapp(principal, dappPublicKey);
    const created = await this.prisma.notificationType.create({
      data: {
        name: command.name,
        humanReadableId: command.humanReadableId,
        trigger: command.trigger,
        orderingPriority: command.orderingPriority,
        enabled: command.defaultConfig.enabled,
        tags: command.tags ?? [],
        dappId: principal.dapp.id,
      },
    });
    return NotificationTypeDto.fromDb(created);
  }

  @Patch(':notificationTypeId')
  async patch(
    @DappAuthPrincipal() principal: DappPrincipal,
    @Param() { dappPublicKey }: DappResourceId,
    @Param() { notificationTypeId }: NotificationTypeResourceId,
    @Body() command: PatchNotificationTypeCommandDto,
  ): Promise<NotificationTypeDto> {
    checkPrincipalAuthorizedToUseDapp(principal, dappPublicKey);
    await this.findOne(principal, { dappPublicKey }, { notificationTypeId });
    const created = await this.prisma.notificationType.update({
      where: {
        dappId_id: {
          dappId: principal.dapp.id,
          id: notificationTypeId,
        },
      },
      data: {
        ...(command.name && { name: command.name }),
        ...(command.humanReadableId && {
          code: command.humanReadableId.toLowerCase().trim(),
        }),
        ...(command.trigger && { description: command.trigger }),
        ...(command.orderingPriority && {
          orderingPriority: command.orderingPriority,
        }),
        ...(command?.defaultConfig?.enabled && {
          enabled: command.defaultConfig.enabled,
        }),
        ...(command.tags && {
          tags: command.tags,
        }),
      },
    });
    return NotificationTypeDto.fromDb(created);
  }

  @Delete(':notificationTypeId')
  async delete(
    @DappAuthPrincipal() principal: DappPrincipal,
    @Param() { dappPublicKey }: DappResourceId,
    @Param() { notificationTypeId }: NotificationTypeResourceId,
  ) {
    await this.findOne(principal, { dappPublicKey }, { notificationTypeId });
    await this.prisma.notificationType.delete({
      where: {
        dappId_id: {
          dappId: principal.dapp.id,
          id: notificationTypeId,
        },
      },
    });
  }
}
