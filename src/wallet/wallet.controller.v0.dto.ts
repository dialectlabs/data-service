import { IsBoolean, IsIn, IsNotEmpty, IsOptional } from 'class-validator';

// Addresses

export class AddressDto {
  @IsOptional()
  readonly id!: string;
  readonly type!: string; // e.g. 'email' or 'sms'
  readonly verified!: boolean;
}

// Dapp Addresses

export class DappAddressDto extends AddressDto {
  readonly addressId!: string;
  readonly dapp!: string; // e.g. 'D1ALECTfeCZt9bAbPWtJk7ntv24vDYGPmyS7swp7DY5h'
  readonly enabled!: boolean;
  readonly value?: string;
}

export class PutDappAddressDto {
  /*
    This payload is overloaded to support 2 use cases:

    1. An address must be updated. Requires:
      - addressId
      - value
      - enabled
    2. An address does not need to be updated. Requires:
      - enabled
    */
  readonly addressId!: string;
  // Switch to wallets api v1, @IsString() validation is removed to fix serde issue from https://github.com/dialectlabs/react/commit/9f87c0b0f398c3a7445ee49aeab2cbd5b6799141#diff-3cbf26f557fe89acc9b185b50a40e3dd7c54feafbfe7e1cd8f3bafd35a870b08R60
  @IsOptional()
  readonly value!: string;
  @IsNotEmpty()
  @IsBoolean()
  readonly enabled!: boolean;
}

export class PostDappAddressDto extends PutDappAddressDto {
  /*
    This payload is overloaded to support 3 use cases:

    1. An address must also be created. Requires:
      - type
      - value
      - enabled
    2. An address exists but must be updated. Requires:
      - addressId
      - value
      - enabled
    3. An address exists and does not need to be updated. Requires:
      - addressId
      - enabled

    N.b.
    TODO: !!! This code assumes there is only one telegram bot, hence only one telegram_chat_id, created at the original /start event from telegram.service.ts.

    TODO: !!! For future implementations where different dapps have different teelgram addresses, the act of enabling an existing (& verified address) for telegram involves the additional step of enabling the bot via a /start command, only after which the user may receive unprompted messages from the bot. To be solved.

    What I remember that we're actually sending:
    - type
    - enabled
    but we can get the address id by:
    - finding the address of type `type` on file for wallet public_key from the url
    */
  @IsIn(['wallet', 'email', 'sms', 'telegram'])
  readonly type!: string;
}

export class VerifyAddressDto {
  readonly code!: string;
  readonly addressId!: string;
}

export class VerifySmsDto {
  readonly code!: string;
  readonly addressId!: string;
}

export class PostDappAddressDto2 extends PutDappAddressDto {}
