import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthPrincipal, Principal } from '../auth/authenticaiton.decorator';
import {
  AddressDto,
  AddressResourceId,
  AddressTypeDto,
  CreateAddressCommand,
  fromAddressTypeDto,
  PatchAddressCommand,
  toAddressDto,
} from '../address/address.controller.dto';
import { AuthenticationGuard } from '../auth/authentication.guard';
import { PrismaService } from '../prisma/prisma.service';
import { MailVerificationService } from '../mail/mail.service';
import { SmsVerificationService } from '../sms/sms.service';
import { generateVerificationCode } from '../utils';
import { PersistedAddressType } from '../address/address.repository';
import { VerifyAddressCommandDto } from './wallet-addresses.controller.v1.dto';
import { AddressService } from '../address/address.service';
import { Duration } from 'luxon';

// https://stackoverflow.com/questions/35719797/is-using-magic-me-self-resource-identifiers-going-against-rest-principles
@ApiTags('Wallet address')
@ApiBearerAuth()
@UseGuards(AuthenticationGuard)
@Controller({
  path: 'wallets/me/addresses',
  version: '1',
})
export class WalletAddressesControllerV1 {
  constructor(
    private readonly prisma: PrismaService,
    private readonly addressService: AddressService,
    private readonly mailService: MailVerificationService,
    private readonly smsService: SmsVerificationService,
  ) {}

  @Get('/')
  async findAll(@AuthPrincipal() { wallet }: Principal): Promise<AddressDto[]> {
    const addresses = await this.addressService.findAll(wallet.id);
    return addresses.map((it) => toAddressDto(it));
  }

  @Get('/:addressId')
  async findOne(
    @AuthPrincipal() { wallet }: Principal,
    @Param() { addressId }: AddressResourceId,
  ): Promise<AddressDto> {
    const address = await this.addressService.findOne(addressId, wallet.id);
    return toAddressDto(address);
  }

  @Post('/')
  async create(
    @AuthPrincipal() { wallet }: Principal,
    @Body() command: CreateAddressCommand,
  ): Promise<AddressDto> {
    const verificationNeeded =
      WalletAddressesControllerV1.addressVerificationNeededAfterChange(
        command.type,
      );
    const verificationCode = generateVerificationCode();
    const addressCreated = await this.prisma.address.create({
      data: {
        walletId: wallet.id,
        type: fromAddressTypeDto(command.type),
        verified: !verificationNeeded,
        ...(verificationNeeded && {
          verificationCode,
          verificationCodeSentAt: new Date(),
        }),
        value: command.value.toLowerCase().trim(),
      },
      include: {
        wallet: true,
      },
    });
    if (verificationNeeded) {
      this.initiateAddressVerification(
        command.type,
        addressCreated.value,
        verificationCode,
      );
    }
    return toAddressDto(addressCreated);
  }

  @Patch('/:addressId')
  async patch(
    @AuthPrincipal() { wallet }: Principal,
    @Param() { addressId }: AddressResourceId,
    @Body() command: PatchAddressCommand,
  ): Promise<AddressDto> {
    const existingAddress = await this.addressService.findOne(
      addressId,
      wallet.id,
    );
    const newAddressValue = command.value && command.value.toLowerCase().trim();
    const addressValueChanged = Boolean(
      newAddressValue && newAddressValue !== existingAddress.value,
    );
    const verificationNeeded =
      addressValueChanged &&
      WalletAddressesControllerV1.addressVerificationNeededAfterChange(
        existingAddress.type as PersistedAddressType,
      );

    const verificationCode = generateVerificationCode();
    const addressUpdated = await this.prisma.address.update({
      where: {
        walletId_id: {
          walletId: wallet.id,
          id: addressId,
        },
      },
      data: {
        ...(verificationNeeded && {
          verified: false,
          verificationCode,
          verificationCodeSentAt: new Date(),
        }),
        ...(addressValueChanged && { value: newAddressValue }),
      },
      include: {
        wallet: true,
      },
    });
    if (verificationNeeded) {
      this.initiateAddressVerification(
        addressUpdated.type as PersistedAddressType,
        addressUpdated.value,
        verificationCode,
      );
    }
    return toAddressDto(addressUpdated);
  }

  @Delete('/:addressId')
  async delete(
    @AuthPrincipal() { wallet }: Principal,
    @Param() { addressId }: AddressResourceId,
  ) {
    await this.addressService.findOne(addressId, wallet.id);
    await this.prisma.address.delete({
      where: {
        walletId_id: {
          walletId: wallet.id,
          id: addressId,
        },
      },
    });
  }

  @Post('/:addressId/verification')
  async verify(
    @AuthPrincipal() { wallet }: Principal,
    @Param() { addressId }: AddressResourceId,
    @Body() command: VerifyAddressCommandDto,
  ): Promise<AddressDto> {
    const existingAddress = await this.addressService.findOne(
      addressId,
      wallet.id,
    );
    if (existingAddress.verified) {
      return toAddressDto(existingAddress);
    }
    if (existingAddress.verificationAttempts >= 3) {
      throw new UnprocessableEntityException(
        `Verification failed, please resend verification code`,
      );
    }
    const submittedVerificationCode = command.code.toLowerCase().trim();
    if (submittedVerificationCode !== existingAddress.verificationCode) {
      this.prisma.address.update({
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
      throw new UnprocessableEntityException(
        `Incorrect verification code ${submittedVerificationCode}`,
      );
    }
    const updated = await this.prisma.address.update({
      where: {
        walletId_id: {
          walletId: wallet.id,
          id: addressId,
        },
      },
      data: {
        verified: true,
      },
      include: {
        wallet: true,
      },
    });
    return toAddressDto(updated);
  }

  @Post('/:addressId/verification/resendCode')
  async resendVerificationCode(
    @AuthPrincipal() { wallet }: Principal,
    @Param() { addressId }: AddressResourceId,
  ): Promise<void> {
    const existingAddress = await this.addressService.findOne(
      addressId,
      wallet.id,
    );
    if (existingAddress.verified) {
      return;
    }
    if (
      !(
        existingAddress.verificationCodeSentAt &&
        existingAddress.verificationCode
      )
    ) {
      throw new UnprocessableEntityException(
        `There's no existing verification code record.`,
      );
    }
    const allowedResendInterval = Duration.fromObject({
      seconds: 60,
    }).toMillis();
    const elapsedSinceLastAddressUpdate =
      new Date().getTime() - existingAddress.verificationCodeSentAt?.getTime();
    if (elapsedSinceLastAddressUpdate < allowedResendInterval) {
      throw new UnprocessableEntityException(
        `Please wait ${Math.ceil(
          (allowedResendInterval - elapsedSinceLastAddressUpdate) / 60,
        )} before resending code`,
      );
    }
    const verificationCode = generateVerificationCode();
    const addressUpdated = await this.prisma.address.update({
      where: {
        walletId_id: {
          walletId: wallet.id,
          id: addressId,
        },
      },
      data: {
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
      addressUpdated.type as PersistedAddressType,
      addressUpdated.value,
      verificationCode,
    );
  }

  private static addressVerificationNeededAfterChange(
    addressType: AddressTypeDto | PersistedAddressType,
  ) {
    return (
      addressType === AddressTypeDto.Email ||
      addressType === 'email' ||
      addressType === AddressTypeDto.Sms ||
      addressType === 'sms'
    );
  }

  private initiateAddressVerification(
    addressType: AddressTypeDto | PersistedAddressType,
    addressValue: string,
    verificationCode: string,
  ) {
    if (addressType === AddressTypeDto.Email || addressType === 'email') {
      this.mailService.sendVerificationCode(addressValue, verificationCode);
    }
    if (addressType === AddressTypeDto.Sms || addressType === 'sms') {
      this.smsService.sendVerificationCode(addressValue, verificationCode);
    }
  }
}
