import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { PublicKey } from '@solana/web3.js';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

@Injectable()
export class PublicKeyValidationPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    requireValidPublicKey(value, metadata.data);
    return value;
  }
}

export function requireValidPublicKey(value: string, parameter?: string) {
  try {
    return new PublicKey(value);
  } catch (e: any) {
    throw new BadRequestException(
      `Invalid format public key ${value} for parameter ${parameter}, please check your inputs and try again.`,
    );
  }
}

export function IsPublicKey(validationOptions?: ValidationOptions) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isPublicKey',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return typeof value === 'string' && isPublicKey(value);
        },
        defaultMessage(validationArguments?: ValidationArguments): string {
          return `Invalid format public key ${validationArguments?.value} for parameter ${validationArguments?.property}.`;
        },
      },
    });
  };
}

function isPublicKey(publicKey: string) {
  try {
    new PublicKey(publicKey);
    return true;
  } catch (e: any) {
    return false;
  }
}
