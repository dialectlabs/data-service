import {
    Body,
    Controller,
    Delete,
    Get,
    HttpException,
    HttpStatus,
    Param,
    Post,
    UseGuards,
  } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import {DialectAccountDto, DialectDto, PostDialectDto, PostMessageDto } from './dialect.controller.dto';
import { findAllDialects, findDialect, postDialect, postMessage } from './dialect.prisma';
import { Wallet } from '@prisma/client';

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

  // Create a new dialect
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post('/')
  async post(
    @InjectWallet() wallet: Wallet,
    @Body() postDialectDto: PostDialectDto,
  ) {
    // TODO: Parse & verify inputs, incl. that wallet is a member
    const dialect_ = await postDialect(this.prisma, postDialectDto.members, postDialectDto.encrypted);

    // We know the dialect exists now.
    const dialect = await findDialect(this.prisma, wallet, dialect_.publicKey);
    return DialectAccountDto.fromDialect(dialect!);
  }

  // Get all dialects for a wallet
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

  // Get a dialect by its public key
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

  // Post a message
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post('/:public_key/messages')
  async postMessage(
    @Param('public_key') dialectPublicKey: string,
    @InjectWallet() wallet: Wallet,
    @Body() postMessageDto: PostMessageDto,
  ) {
    // TODO: Reduce includes in this query since less is needed.
    const text = postMessageDto.text;
    if (!text) throw new HttpException(`Must supply text to the body of this request. Text supplied ${text}`, HttpStatus.BAD_REQUEST);
    let dialect = await findDialect(this.prisma, wallet, dialectPublicKey);
    if (!dialect) throw new HttpException(`No Dialect with public key ${dialectPublicKey} found for wallet ${wallet.publicKey}, cannot post new message.`, HttpStatus.BAD_REQUEST);
    // Assert wallet has write privileges
    const member = dialect.members.find(m => m.wallet.publicKey === wallet.publicKey && m.scopes[1]);
    if (!member) throw new HttpException(`Wallet ${wallet.publicKey} does not have write privileges to Dialect ${dialect.publicKey}.`, HttpStatus.UNAUTHORIZED);
    await postMessage(this.prisma, member, dialect.id, text);

    // We know the dialect exists at this point
    dialect = await findDialect(this.prisma, wallet, dialectPublicKey);
    return DialectAccountDto.fromDialect(dialect!);
  }

  // TODO: Delete a dialect
};
