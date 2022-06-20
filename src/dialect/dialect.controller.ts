import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateDialectCommandDto,
  DialectAccountDto,
  DialectResourceId,
  FindDialectQuery,
  SendMessageCommandDto,
} from './dialect.controller.dto';
import { AuthenticationGuard } from '../auth/authentication.guard';
import { AuthPrincipal, Principal } from '../auth/authenticaiton.decorator';
import { DialectService } from './dialect.service';

@ApiTags('Dialects')
@ApiBearerAuth()
@UseGuards(AuthenticationGuard)
@Controller({
  path: 'dialects',
  version: '0',
})
export class DialectController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dialectService: DialectService,
  ) {}

  @Get('/')
  async findAll(
    @AuthPrincipal() { wallet }: Principal,
    @Query() query: FindDialectQuery,
  ) {
    const dialects = await this.dialectService.findAll(wallet, query);
    return dialects.map(DialectAccountDto.fromDialect);
  }

  @Post('/')
  async create(
    @AuthPrincipal() { wallet }: Principal,
    @Body() command: CreateDialectCommandDto,
  ) {
    const dialect = await this.dialectService.create(command, wallet);
    return DialectAccountDto.fromDialect(dialect);
  }

  @Get('/:dialectPublicKey')
  async getDialect(
    @AuthPrincipal() { wallet }: Principal,
    @Param() { dialectPublicKey }: DialectResourceId,
  ) {
    const dialect = await this.dialectService.find(dialectPublicKey, wallet);
    if (!dialect)
      throw new NotFoundException(
        `No Dialect with public key ${dialectPublicKey} found for wallet ${wallet.publicKey}.`,
      );
    return DialectAccountDto.fromDialect(dialect);
  }

  @Delete('/:dialectPublicKey')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @AuthPrincipal() { wallet }: Principal,
    @Param() { dialectPublicKey }: DialectResourceId,
  ) {
    await this.dialectService.delete(dialectPublicKey, wallet);
  }

  @Post('/:dialectPublicKey/messages')
  async sendMessage(
    @AuthPrincipal() { wallet }: Principal,
    @Param() { dialectPublicKey }: DialectResourceId,
    @Body() command: SendMessageCommandDto,
  ) {
    const dialect = await this.dialectService.sendMessage(
      command,
      dialectPublicKey,
      wallet,
    );
    return DialectAccountDto.fromDialect(dialect);
  }
}
