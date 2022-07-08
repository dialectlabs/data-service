import { Injectable, Logger } from '@nestjs/common';
import {
  BroadcastMessageCommandDto,
  MulticastMessageCommandDto,
  UnicastMessageCommandDto,
} from './dapp-message.controller.dto';
import { Address, Dapp, DappAddress, Wallet } from '@prisma/client';
import { PersistedAddressType } from '../address/address.repository';
import { TelegramService } from '../telegram/telegram.service';
import { MailService } from '../mail/mail.service';
import { SmsService } from '../sms/sms.service';
import { DialectService } from '../dialect/dialect.service';
import {
  DappAddressService,
  extractTelegramChatId,
} from '../dapp-address/dapp-address.service';
import { DappPrincipal } from '../auth/authenticaiton.decorator';
import { UnencryptedTextSerde } from '@dialectlabs/web3';
import { DappService } from '../dapp/dapp.service';

interface SendMessageCommand {
  title: string;
  message: string;
  receivers: (DappAddress & {
    dapp: Dapp;
    address: Address & { wallet: Wallet };
  })[];
  dappPrincipal: DappPrincipal;
}

@Injectable()
export class DappMessageService {
  private readonly textSerde = new UnencryptedTextSerde();
  private readonly logger = new Logger(DappMessageService.name);

  constructor(
    private readonly dappService: DappService,
    private readonly dappAddress: DappAddressService,
    private readonly telegram: TelegramService,
    private readonly mail: MailService,
    private readonly sms: SmsService,
    private readonly dialect: DialectService,
  ) {}

  async unicast(command: UnicastMessageCommandDto, dapp: DappPrincipal) {
    const receivers = await this.dappAddress.findAll({
      dapp: {
        publicKey: dapp.wallet.publicKey,
      },
      enabled: true,
      address: {
        verified: true,
        wallet: {
          publicKeys: [command.recipientPublicKey],
        },
      },
    });
    return this.send({
      ...command,
      dappPrincipal: dapp,
      receivers,
    });
  }

  async multicast(command: MulticastMessageCommandDto, dapp: DappPrincipal) {
    const receivers = await this.dappAddress.findAll({
      dapp: {
        publicKey: dapp.wallet.publicKey,
      },
      enabled: true,
      address: {
        verified: true,
        wallet: {
          publicKeys: command.recipientPublicKeys,
        },
      },
    });
    return this.send({
      ...command,
      dappPrincipal: dapp,
      receivers,
    });
  }

  async broadcast(command: BroadcastMessageCommandDto, dapp: DappPrincipal) {
    const receivers = await this.dappAddress.findAll({
      dapp: {
        publicKey: dapp.wallet.publicKey,
      },
      enabled: true,
      address: {
        verified: true,
      },
    });
    return this.send({
      ...command,
      dappPrincipal: dapp,
      receivers,
    });
  }

  async send(command: SendMessageCommand) {
    const title = command.title;
    const message = command.message;
    const dappNameAndTitle = `${command.dappPrincipal.dapp.name}: ${title}`;
    const allSettled = Promise.allSettled(
      command.receivers.map(async (da) => {
        switch (da.address.type as PersistedAddressType) {
          case 'telegram':
            const telegramChatId = extractTelegramChatId(da);
            return (
              telegramChatId &&
              this.telegram.send(telegramChatId, dappNameAndTitle, message)
            );
          case 'email':
            return this.mail.send(da.address.value, dappNameAndTitle, message);
          case 'sms':
            const smsMessage = `${dappNameAndTitle}\n${command.message}`;
            return this.sms.send(da.address.value, smsMessage);
          case 'wallet':
            return this.dialect.sendMessage(
              Buffer.from(this.textSerde.serialize(command.message)),
              {
                encrypted: false,
                memberWalletPublicKeys: [
                  command.dappPrincipal.wallet.publicKey,
                  da.address.wallet.publicKey,
                ],
              },
              command.dappPrincipal,
            );
        }
      }),
    );
    allSettled.then((res) => {
      const failures = res
        .filter((it) => it.status === 'rejected')
        .map((it) => it as PromiseRejectedResult)
        .map((it) => it.reason);
      if (failures.length > 0) {
        this.logger.error(
          `Failed to send notifications:\n ${JSON.stringify(
            failures,
            null,
            2,
          )}`,
        );
      }
    });
    return allSettled;
  }
}
