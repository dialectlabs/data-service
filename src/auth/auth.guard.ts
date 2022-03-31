import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { Request } from 'express';
import { Wallet } from '@prisma/client';

function base64ToUint8(string: string): Uint8Array {
  return new Uint8Array(
    atob(string)
      .split('')
      .map(function (c) {
        return c.charCodeAt(0);
      }),
  );
}
const bearerHeader = 'Bearer ';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { wallet: Wallet }>();

    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('No Authorization header');
    }
    if (!authHeader.startsWith(bearerHeader)) {
      throw new UnauthorizedException('Invalid authorization token');
    }

    const singerPublicKey = AuthGuard.requireValidPublicKey(
      request.params.public_key,
    );
    const authToken = authHeader.slice(bearerHeader.length).trim();
    AuthGuard.checkTokenValid(authToken, singerPublicKey);
    request.wallet = await this.upsertWallet(singerPublicKey);
    return true;
  }

  private static requireValidPublicKey(publicKey: string) {
    try {
      return new PublicKey(publicKey);
    } catch (e: any) {
      throw new BadRequestException(
        `Invalid format wallet public_key ${publicKey}, please check your inputs and try again.`,
      );
    }
  }

  private static checkTokenValid(
    authToken: string,
    signerPublicKey: PublicKey,
  ) {
    const expiresAtUtcMs = this.extractExpirationTime(authToken);
    const signature = this.extractSignature(authToken);
    this.validateSignature(expiresAtUtcMs, signature, signerPublicKey);

    const nowUtcMs = new Date().getTime();
    if (expiresAtUtcMs > nowUtcMs) {
      throw new UnauthorizedException('Token expired');
    }
  }

  private static validateSignature(
    expiresAtUtcMs: number,
    signature: Uint8Array,
    signerPublicKey: PublicKey,
  ) {
    try {
      const dateEncoded = new TextEncoder().encode(
        btoa(JSON.stringify(expiresAtUtcMs)),
      );
      const signatureVerified = nacl.sign.detached.verify(
        dateEncoded,
        signature,
        signerPublicKey.toBytes(),
      );
      if (!signatureVerified) {
        throw new UnauthorizedException('Signature verification failed');
      }
    } catch (e: any) {
      throw new UnauthorizedException('Signature verification failed');
    }
  }

  private static extractSignature(authToken: string) {
    try {
      return base64ToUint8(authToken.split('.')[1] || '');
    } catch (e: any) {
      throw new UnauthorizedException('Signature verification failed');
    }
  }

  private static extractExpirationTime(authToken: string) {
    try {
      return parseInt(authToken.split('.')[0], 10);
    } catch (e: any) {
      throw new UnauthorizedException('Signature verification failed');
    }
  }

  private upsertWallet(publicKey: PublicKey) {
    return this.prisma.wallet.upsert({
      where: {
        publicKey: publicKey.toBase58(),
      },
      create: {
        publicKey: publicKey.toBase58(),
      },
      update: {},
    });
  }
}
