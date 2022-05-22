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
import {DialectAccountDto } from './dialect.controller.dto';
import { DialectedMember, findAllDialects, findDialect, MemberedAndMessagedDialect } from './dialect.prisma';
import { Dialect, Wallet } from '@prisma/client';

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
    const dialects = await findAllDialects(this.prisma, wallet);
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

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get('/:public_key')
  async getDialect(
    @Param('public_key') dialectPublicKey: string,
    @InjectWallet() wallet: Wallet,
  ) {
    const dialect = await findDialect(this.prisma, wallet, dialectPublicKey);
    if (!dialect) throw new HttpException(`No Dialect with public key ${dialectPublicKey} found for wallet ${wallet.publicKey}.`, HttpStatus.NOT_FOUND);
    return DialectAccountDto.fromDialect(dialect);
  }
};
