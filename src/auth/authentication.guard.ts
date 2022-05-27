import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { Request } from 'express';
import { requireValidPublicKey } from '../middleware/public-key-validation';
import { PrismaService } from '../prisma/prisma.service';
import { Token } from '@dialectlabs/sdk';
import { Principal } from './authenticaiton.decorator';

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
export class AuthenticationGuard implements CanActivate {
  private readonly logger = new Logger(AuthenticationGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & Principal>();
    const authToken = AuthenticationGuard.getAuthToken(request);
    // TODO: remove token v1 support after migration to SDK
    if (AuthenticationGuard.isTokenV1(authToken)) {
      const wallet = await this.validateTokenV1(request, authToken);
      request.wallet = wallet;
      return true;
    }
    const wallet = await this.validateTokenV2(authToken);
    request.wallet = wallet;
    return true;
  }

  private validateTokenV1(request: Request, authToken: string) {
    const singerPublicKey = requireValidPublicKey(
      request.params.public_key,
      'public_key',
    );
    AuthenticationGuard.checkTokenValid(authToken, singerPublicKey);
    return this.upsertWallet(singerPublicKey);
  }

  private validateTokenV2(authToken: string) {
    const token = this.parseTokenV2(authToken);
    if (!Token.isSignatureValid(token)) {
      throw new UnauthorizedException('Signature verification failed');
    }
    if (Token.isExpired(token)) {
      throw new UnauthorizedException('Token expired');
    }
    const publicKey = requireValidPublicKey(token.body.sub);
    return this.upsertWallet(publicKey);
  }

  private parseTokenV2(authToken: string) {
    try {
      return Token.parse(authToken);
    } catch (e) {
      this.logger.log(
        `Failed to parse token ${authToken}\n ${JSON.stringify(e)}`,
      );
      throw new UnauthorizedException('Invalid token');
    }
  }

  private static getAuthToken(request: Request) {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('No Authorization header');
    }
    if (!authHeader.startsWith(bearerHeader)) {
      throw new UnauthorizedException('Invalid authorization token');
    }
    return authHeader.slice(bearerHeader.length).trim();
  }

  private static isTokenV1(authToken: string) {
    // old format: ${timestamp}.${signature}
    return authToken.split('.').length == 2;
  }

  private static checkTokenValid(
    authToken: string,
    signerPublicKey: PublicKey,
  ) {
    const expiresAtUtcMs = this.extractExpirationTime(authToken);
    const signature = this.extractSignature(authToken);
    this.validateSignature(expiresAtUtcMs, signature, signerPublicKey);

    const nowUtcMs = new Date().getTime();
    if (expiresAtUtcMs < nowUtcMs) {
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
