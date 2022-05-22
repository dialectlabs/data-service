import {
    Body,
    Controller,
    Delete,
    Get,
    HttpException,
    HttpStatus,
    Param,
    Post,
    Put,
    UseGuards,
  } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import {DialectAccountDto, DialectedMember, DialectDto, MemberDto, MessageDto} from './dialect.controller.dto';
import { Dialect, Member, Message, Prisma, Wallet } from '@prisma/client';

import { AuthGuard } from '../auth/auth.guard';
import { InjectWallet } from '../auth/auth.decorator';

@ApiTags('Dialects')
@Controller({
  path: 'dialects',
  version: '0',
})
export class DialectController {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get('/')
  async get(
    @InjectWallet() wallet: Wallet,
  ) {
    // Fetch dialects for member. We do this via the members since includes are trivial.
    const members: DialectedMember[] = await this.prisma.member.findMany({
      where: {
        walletId: wallet.id,
      },
      include: {
        dialect: {
          include: {
            members: {
              include: {
                wallet: true,
              }
            },
            // TODO: Limit to last N messages, sorted.
            messages: {
              include: {
                member: {
                  include: {
                    wallet: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // TODO: confirm dialects are already unique & rm filter.
    const dialects = members
      .map((m: DialectedMember) => m.dialect)
      .filter(
        (dialect: Dialect, idx: number, dialects_: Dialect[]) =>
        dialects_.indexOf(dialect) === idx);

    return dialects.map(DialectAccountDto.fromDialect);

    // TODO: rm once above class methods are tested.
    // return dialects.map((d: Dialect) => (
    //   {
    //     publicKey: d.address,
    //     dialect: {
    //       members: d.members.map((m: Member) => ({
    //         publicKey: m.wallet.publicKey,
    //         scopes: m.scopes,
    //       } as MemberDto)),
    //       messages: d.messages.map((m: Message) => ({
    //         owner: m.member.wallet.publicKey,
    //         text: m.text,
    //         timestamp: m.timestamp,
    //       } as MessageDto)),
    //       nextMessageIdx: 0,
    //       lastMessageTimestamp: 0,
    //       encrypted: d.encrypted,
    //     } as DialectDto
    //   } as DialectAccountDto
    // ));
  }
}