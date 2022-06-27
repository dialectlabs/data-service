import { Injectable, Logger } from '@nestjs/common';
import {
  BroadcastNotificationCommandDto,
  MulticastNotificationCommandDto,
  UnicastNotificationCommandDto,
} from './dapp-notifications.controller.dto';
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
import { Principal } from '../auth/authenticaiton.decorator';
import { UnencryptedTextSerde } from '@dialectlabs/web3';
import { DappService } from '../dapp-catalog/dapp.service';

interface SendNotificationCommand {
  title: string;
  message: string;
  receivers: (DappAddress & {
    dapp: Dapp;
    address: Address & { wallet: Wallet };
  })[];
  dapp: Principal;
}

@Injectable()
export class DappNotificationsService {
  private readonly textSerde = new UnencryptedTextSerde();
  private readonly logger = new Logger(DappNotificationsService.name);

  constructor(
    private readonly dappService: DappService,
    private readonly dappAddress: DappAddressService,
    private readonly telegram: TelegramService,
    private readonly mail: MailService,
    private readonly sms: SmsService,
    private readonly dialect: DialectService,
  ) {}

  async unicast(command: UnicastNotificationCommandDto, dapp: Principal) {
    const receivers = await this.dappAddress.findAll({
      dapp: {
        publicKey: dapp.wallet.publicKey,
      },
      enabled: true,
      address: {
        verified: true,
        wallet: {
          publicKeys: [command.receiverPublicKey],
        },
      },
    });
    return this.send({
      ...command,
      dapp: dapp,
      receivers,
    });
  }

  async multicast(command: MulticastNotificationCommandDto, dapp: Principal) {
    const receivers = await this.dappAddress.findAll({
      dapp: {
        publicKey: dapp.wallet.publicKey,
      },
      enabled: true,
      address: {
        verified: true,
        wallet: {
          publicKeys: command.receiverPublicKeys,
        },
      },
    });
    return this.send({
      ...command,
      dapp,
      receivers,
    });
  }

  async broadcast(command: BroadcastNotificationCommandDto, dapp: Principal) {
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
      dapp,
      receivers,
    });
  }

  async send(command: SendNotificationCommand) {
    const title = command.title;
    const message = command.message;
    const allSettled = Promise.allSettled(
      command.receivers.map(async (da) => {
        switch (da.address.type as PersistedAddressType) {
          case 'telegram':
            const telegramChatId = extractTelegramChatId(da);
            return (
              telegramChatId && this.telegram.send(telegramChatId, message)
            );
          case 'email':
            return this.mail.send(da.address.value, title, message);
          case 'sms':
            return this.sms.send(da.address.value, message);
          case 'wallet':
            return this.dialect.sendMessage(
              Buffer.from(this.textSerde.serialize(command.message)),
              {
                encrypted: false,
                memberWalletPublicKeys: [
                  command.dapp.wallet.publicKey,
                  da.address.wallet.publicKey,
                ],
              },
              command.dapp,
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
