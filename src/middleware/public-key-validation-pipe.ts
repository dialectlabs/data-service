import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { PublicKey } from '@solana/web3.js';

@Injectable()
export class PublicKeyValidationPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    checkPublicKeyIsValid(value, metadata.data);
    return value;
  }
}

export function checkPublicKeyIsValid(value: string, parameter?: string) {
  try {
    return new PublicKey(value);
  } catch (e: any) {
    throw new BadRequestException(
      `Invalid format public key ${value} for parameter ${parameter}, please check your inputs and try again.`,
    );
  }
}
