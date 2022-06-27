import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthPrincipal, Principal } from '../auth/authenticaiton.decorator';
import { AuthenticationGuard } from '../auth/authentication.guard';
import { PrismaService } from '../prisma/prisma.service';
import { MessageDto } from '../dialect/dialect.controller.dto';
import { MessageService } from '../dialect/message.service';
import { FindDappMessagesQueryDto } from './wallet-messages.controller.v1.dto';

@ApiTags('Wallet messages')
@ApiBearerAuth()
@UseGuards(AuthenticationGuard)
@Controller({
  path: 'wallets/me',
  version: '1',
})
export class WalletAddressesControllerV1 {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messageService: MessageService,
  ) {}

  @Get('/dappMessages')
  async findAll(
    @AuthPrincipal() { wallet }: Principal,
    query: FindDappMessagesQueryDto,
  ): Promise<MessageDto[]> {
    const messages = await this.messageService.findAllDappMessages({
      wallet,
      dapp: {
        verified: true,
      },
      skip: query.skip ?? 0,
      take: query.take ?? 20,
    });
    return messages.map(MessageDto.fromMessage);
  }
}
