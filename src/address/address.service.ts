import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailVerificationService } from '../mail/mail.service';
import { SmsVerificationService } from '../sms/sms.service';
import { generateVerificationCode } from '../utils';
import {
  CreateAddressCommandDto,
  fromAddressTypeDto,
  PatchAddressCommandDto,
} from './address.controller.dto';
import { PersistedAddressType } from './address.repository';
import { Address, Wallet } from '@prisma/client';
import { VerifyAddressCommandDto } from '../wallet/wallet-addresses.controller.v1.dto';
import { Duration } from 'luxon';

const verificationCodeResendDelay = Duration.fromObject({
  seconds: 60,
});

@Injectable()
export class AddressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailVerificationService,
    private readonly smsService: SmsVerificationService,
  ) {}

  findAll(walletId: string) {
    return this.prisma.address.findMany({
      where: {
        walletId,
      },
      include: {
        wallet: true,
      },
    });
  }

  findOne(addressId: string, walletId: string) {
    return this.prisma.address.findUnique({
      where: {
        walletId_id: {
          walletId,
          id: addressId,
        },
      },
      include: {
        wallet: true,
      },
      rejectOnNotFound: (e) => new NotFoundException(e.message),
    });
  }

  async create({ type, value }: CreateAddressCommandDto, wallet: Wallet) {
    const persistedAddressType = fromAddressTypeDto(type);
    const verificationNeeded =
      addressRequiresVerification(persistedAddressType);
    const addressValue = value.trim();
    if (verificationNeeded) {
      return this.createWithVerification(
        addressValue,
        persistedAddressType,
        wallet,
      );
    }
    return this.createWithoutVerification(
      addressValue,
      persistedAddressType,
      wallet,
    );
  }

  private async createWithVerification(
    addressValue: string,
    type: PersistedAddressType,
    wallet: Wallet,
  ) {
    const verificationCode = generateVerificationCode();
    const addressCreated = await this.prisma.address.create({
      data: {
        value: addressValue,
        type,
        walletId: wallet.id,
        verified: false,
        verificationCode,
        verificationCodeSentAt: new Date(),
      },
      include: {
        wallet: true,
      },
    });
    this.initiateAddressVerification(
      addressCreated.value,
      addressCreated.type as PersistedAddressType,
      verificationCode,
    );
    return addressCreated;
  }

  private createWithoutVerification(
    addressValue: string,
    type: PersistedAddressType,
    wallet: Wallet,
  ) {
    return this.prisma.address.create({
      data: {
        value: addressValue,
        type,
        walletId: wallet.id,
        verified: true,
      },
      include: {
        wallet: true,
      },
    });
  }

  private initiateAddressVerification(
    addressValue: string,
    addressType: PersistedAddressType,
    verificationCode: string,
  ) {
    if (addressType === 'email') {
      this.mailService.sendVerificationCode(addressValue, verificationCode);
    }
    if (addressType === 'sms') {
      this.smsService.sendVerificationCode(addressValue, verificationCode);
    }
  }

  async patch(
    addressId: string,
    command: PatchAddressCommandDto,
    wallet: Wallet,
  ) {
    const existingAddress = await this.findOne(addressId, wallet.id);
    const newAddressValue = command.value?.trim();
    const addressValueChanged = Boolean(
      newAddressValue && newAddressValue !== existingAddress.value,
    );
    const verificationNeeded =
      newAddressValue &&
      addressValueChanged &&
      addressRequiresVerification(existingAddress.type as PersistedAddressType);
    if (verificationNeeded) {
      return this.updateWithVerification(addressId, newAddressValue, wallet);
    }
    return this.updateWithoutVerification(addressId, command, wallet);
  }

  private async updateWithVerification(
    addressId: string,
    newAddressValue: string,
    wallet: Wallet,
  ) {
    const verificationCode = generateVerificationCode();
    const addressUpdated = await this.prisma.address.update({
      where: {
        walletId_id: {
          walletId: wallet.id,
          id: addressId,
        },
      },
      data: {
        value: newAddressValue,
        verified: false,
        verificationCode,
        verificationAttempts: 0,
        verificationCodeSentAt: new Date(),
      },
      include: {
        wallet: true,
      },
    });
    this.initiateAddressVerification(
      addressUpdated.value,
      addressUpdated.type as PersistedAddressType,
      verificationCode,
    );
    return addressUpdated;
  }

  private updateWithoutVerification(
    addressId: string,
    _: PatchAddressCommandDto,
    wallet: Wallet,
  ) {
    return this.prisma.address.update({
      where: {
        walletId_id: {
          walletId: wallet.id,
          id: addressId,
        },
      },
      data: {},
      include: {
        wallet: true,
      },
    });
  }

  async delete(addressId: string, walletId: string) {
    this.findOne(addressId, walletId);
    await this.prisma.address.delete({
      where: {
        walletId_id: {
          walletId,
          id: addressId,
        },
      },
    });
  }

  async verify(
    addressId: string,
    command: VerifyAddressCommandDto,
    wallet: Wallet,
  ) {
    const existingAddress = await this.findOne(addressId, wallet.id);
    if (existingAddress.verified) {
      return existingAddress;
    }
    if (existingAddress.verificationAttempts >= 3) {
      throw new UnprocessableEntityException(
        `Verification attempts limit reached, please resend verification code`,
      );
    }
    const submittedVerificationCode = command.code.trim();
    if (submittedVerificationCode !== existingAddress.verificationCode) {
      await this.increaseVerificationAttempts(addressId, wallet);
      throw new UnprocessableEntityException(
        `Incorrect verification code ${submittedVerificationCode}`,
      );
    }
    return this.updateOnSuccessfulVerification(addressId, wallet);
  }

  private updateOnSuccessfulVerification(addressId: string, wallet: Wallet) {
    return this.prisma.address.update({
      where: {
        walletId_id: {
          walletId: wallet.id,
          id: addressId,
        },
      },
      data: {
        verified: true,
        verificationAttempts: {
          increment: 1,
        },
      },
      include: {
        wallet: true,
      },
    });
  }

  private increaseVerificationAttempts(addressId: string, wallet: Wallet) {
    return this.prisma.address.update({
      where: {
        walletId_id: {
          walletId: wallet.id,
          id: addressId,
        },
      },
      data: {
        verificationAttempts: {
          increment: 1,
        },
      },
    });
  }

  async resendVerificationCode(addressId: string, wallet: Wallet) {
    const existingAddress = await this.findOne(addressId, wallet.id);
    if (existingAddress.verified) {
      return;
    }
    AddressService.checkCanSendNewVerificationCode(existingAddress);
    return this.updateWithVerification(
      addressId,
      existingAddress.value,
      wallet,
    );
  }

  private static checkCanSendNewVerificationCode(address: Address) {
    if (!(address.verificationCodeSentAt && address.verificationCode)) {
      throw new UnprocessableEntityException(
        `There's no existing verification code record.`,
      );
    }
    const elapsedSinceVerificationCodeSentMs =
      new Date().getTime() - address.verificationCodeSentAt.getTime();
    const verificationCodeResendDelayMs =
      verificationCodeResendDelay.toMillis();
    const canSendNewVerificationCode =
      elapsedSinceVerificationCodeSentMs >= verificationCodeResendDelayMs;
    if (!canSendNewVerificationCode) {
      throw new UnprocessableEntityException(
        `Please wait ${Math.ceil(
          (verificationCodeResendDelayMs - elapsedSinceVerificationCodeSentMs) /
            1000,
        )} before resending verification code`,
      );
    }
  }
}

function addressRequiresVerification(addressType: PersistedAddressType) {
  return addressType !== 'wallet';
}
