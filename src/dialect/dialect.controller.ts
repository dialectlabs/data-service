import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateDialectCommandDto,
  DialectAccountDto,
  PostMessageDto,
} from './dialect.controller.dto';
import { deleteDialect, findDialect, postMessage } from './dialect.prisma';
import { AuthenticationGuard } from '../auth/authentication.guard';
import { AuthPrincipal, Principal } from '../auth/authenticaiton.decorator';
import { DialectService } from './dialect.service';
import { PublicKeyValidationPipe } from '../middleware/public-key-validation';

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
  async findAll(@AuthPrincipal() { wallet }: Principal) {
    const dialects = await this.dialectService.findAll(wallet);
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

  @Get('/:public_key')
  async getDialect(
    @AuthPrincipal() { wallet }: Principal,
    @Param('public_key', PublicKeyValidationPipe) dialectPublicKey: string,
  ) {
    const dialect = await this.dialectService.find(dialectPublicKey, wallet);
    if (!dialect)
      throw new NotFoundException(
        `No Dialect with public key ${dialectPublicKey} found for wallet ${wallet.publicKey}.`,
      );
    return DialectAccountDto.fromDialect(dialect);
  }

  @Post('/:public_key/messages')
  async postMessage(
    @Param('public_key') dialectPublicKey: string,
    @AuthPrincipal() { wallet }: Principal,
    @Body() postMessageDto: PostMessageDto,
  ) {
    // TODO: Reduce includes in this query since less is needed.
    const text = postMessageDto.text;
    if (!text)
      throw new HttpException(
        `Must supply text to the body of this request. Text supplied ${text}`,
        HttpStatus.BAD_REQUEST,
      );
    let dialect = await findDialect(this.prisma, wallet, dialectPublicKey);
    if (!dialect)
      throw new HttpException(
        `No Dialect with public key ${dialectPublicKey} found for wallet ${wallet.publicKey}, cannot post new message.`,
        HttpStatus.BAD_REQUEST,
      );
    // Assert wallet has write privileges
    const member = dialect.members.find(
      (m) => m.wallet.publicKey === wallet.publicKey && m.scopes[1],
    );
    if (!member)
      throw new HttpException(
        `Wallet ${wallet.publicKey} does not have write privileges to Dialect ${dialect.publicKey}.`,
        HttpStatus.UNAUTHORIZED,
      );
    await postMessage(this.prisma, member, dialect.id, text);

    // We know the dialect exists at this point
    dialect = await findDialect(this.prisma, wallet, dialectPublicKey);
    return DialectAccountDto.fromDialect(dialect!);
  }

  @Delete('/:public_key')
  async delete(
    @Param('public_key') dialectPublicKey: string,
    @AuthPrincipal() { wallet }: Principal,
  ) {
    await deleteDialect(this.prisma, wallet, dialectPublicKey);
    return HttpStatus.NO_CONTENT;
  }
}
