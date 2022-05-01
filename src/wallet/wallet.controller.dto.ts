import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

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
  @IsString() // TODO: Support custom constraint https://stackoverflow.com/a/53786899/2322073
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
    */
  @IsIn(['email', 'sms', 'telegram'])
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
