import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
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
} from '../addresses/address.controller.dto';
import { AuthenticationGuard } from '../auth/authentication.guard';
import { PrismaService } from '../prisma/prisma.service';
import { MailVerificationService } from '../mail/mail.service';
import { SmsVerificationService } from '../sms/sms.service';
import { generateVerificationCode } from '../utils';
import { PersistedAddressType } from '../addresses/address.repository';

// https://stackoverflow.com/questions/35719797/is-using-magic-me-self-resource-identifiers-going-against-rest-principles
@ApiTags('Wallet addresses')
@ApiBearerAuth()
@UseGuards(AuthenticationGuard)
@Controller({
  path: 'wallets/me/addresses',
  version: '1',
})
export class WalletAddressesControllerV1 {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailVerificationService,
    private readonly smsService: SmsVerificationService,
  ) {}

  @Get('/')
  async findAll(@AuthPrincipal() { wallet }: Principal): Promise<AddressDto[]> {
    const addresses = await this.prisma.address.findMany({
      where: {
        walletId: wallet.id,
      },
      include: {
        wallet: true,
      },
    });
    return addresses.map((it) => toAddressDto(it));
  }

  @Get('/:addressId')
  async findOne(
    @AuthPrincipal() { wallet }: Principal,
    @Param() { addressId }: AddressResourceId,
  ): Promise<AddressDto> {
    const address = await this.prisma.address.findUnique({
      where: {
        walletId_id: {
          walletId: wallet.id,
          id: addressId,
        },
      },
      include: {
        wallet: true,
      },
      rejectOnNotFound: (e) => new NotFoundException(e.message),
    });
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
        ...(verificationNeeded && { verificationCode }),
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
    const existingAddress = await this.findOne({ wallet }, { addressId });
    const newAddressValue = command.value && command.value.toLowerCase().trim();
    const addressValueChanged = Boolean(
      newAddressValue && newAddressValue !== existingAddress.value,
    );
    const verificationNeeded =
      addressValueChanged &&
      WalletAddressesControllerV1.addressVerificationNeededAfterChange(
        existingAddress.type,
      );
    const verificationCode = generateVerificationCode();
    const walletUpdated = await this.prisma.address.update({
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
        }),
        ...(addressValueChanged && { value: newAddressValue }),
      },
      include: {
        wallet: true,
      },
    });
    if (verificationNeeded) {
      this.initiateAddressVerification(
        walletUpdated.type as PersistedAddressType,
        walletUpdated.value,
        verificationCode,
      );
    }
    return toAddressDto(walletUpdated);
  }

  @Delete('/:addressId')
  async delete(
    @AuthPrincipal() { wallet }: Principal,
    @Param() { addressId }: AddressResourceId,
  ) {
    await this.findOne({ wallet }, { addressId });
    await this.prisma.address.delete({
      where: {
        walletId_id: {
          walletId: wallet.id,
          id: addressId,
        },
      },
    });
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
