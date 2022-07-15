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
    return notificationTypes.map(NotificationTypeDto.from);
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
    return NotificationTypeDto.from(notificationType);
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
        code: command.code.toLowerCase().trim(),
        description: command.description,
        enabled: command.defaultConfig.enabled,
        tags: command.tags ?? [],
        dappId: principal.dapp.id,
      },
    });
    return NotificationTypeDto.from(created);
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
        ...(command.code && { code: command.code.toLowerCase().trim() }),
        ...(command.description && { description: command.description }),
        ...(command?.defaultConfig?.enabled && {
          enabled: command.defaultConfig.enabled,
        }),
        ...(command.tags && {
          tags: command.tags,
        }),
      },
    });
    return NotificationTypeDto.from(created);
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
