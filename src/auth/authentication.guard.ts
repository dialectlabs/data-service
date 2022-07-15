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
import { Auth } from '@dialectlabs/sdk';
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

const basicHeader = 'Basic ';
const THE_ONLY_BASIC_AUTH_USER = process.env.BASIC_AUTH_USER;

@Injectable()
export class AuthenticationGuard implements CanActivate {
  private readonly logger = new Logger(AuthenticationGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & Principal>();
    // TODO: remove after all monitoring services are migrated to SDK
    if (AuthenticationGuard.isBasicAuth(request)) {
      request.wallet = await this.validateBasicAuth(request);
      return true;
    }
    const authToken = AuthenticationGuard.getBearerAuthToken(request);
    // TODO: remove token v1 support after migration to SDK
    if (AuthenticationGuard.isTokenV1(authToken)) {
      request.wallet = await this.validateTokenV1(request, authToken);
      return true;
    }
    request.wallet = await this.validateTokenV2(authToken);
    return true;
  }

  private validateTokenV1(request: Request, authToken: string) {
    const singerPublicKey =
      AuthenticationGuard.requireValidPublicKeyPathParamInRequest(request);
    AuthenticationGuard.checkTokenValid(authToken, singerPublicKey);
    return this.upsertWallet(singerPublicKey);
  }

  private static requireValidPublicKeyPathParamInRequest(request: Request) {
    const publicKeyPathParam = request.params.public_key;
    if (!publicKeyPathParam) {
      throw new UnauthorizedException(
        "Resource public key must be passed as 'public_key' path parameter.",
      );
    }
    return requireValidPublicKey(publicKeyPathParam, 'public_key');
  }

  private validateTokenV2(authToken: string) {
    const token = this.parseTokenV2(authToken);
    if (!Auth.tokens.isValid(token)) {
      throw new UnauthorizedException('JWT token not valid');
    }
    const publicKey = requireValidPublicKey(token.body.sub);
    return this.upsertWallet(publicKey);
  }

  private parseTokenV2(authToken: string) {
    try {
      return Auth.tokens.parse(authToken);
    } catch (e) {
      this.logger.log(
        `Failed to parse token ${authToken}\n ${JSON.stringify(e)}`,
      );
      throw new UnauthorizedException('Invalid token');
    }
  }

  private static getBearerAuthToken(request: Request) {
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
    const expTime = authToken.split('.')[0];
    if (!expTime) {
      throw new UnauthorizedException('Expiration time not found in token');
    }
    try {
      return parseInt(expTime, 10);
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

  private static isBasicAuth(request: Request) {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('No Authorization header');
    }
    return authHeader.startsWith(basicHeader);
  }

  private async validateBasicAuth(request: Request) {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('No Authorization header');
    }
    const headerElements = authHeader.split(' ');
    if (headerElements.length !== 2) {
      throw new UnauthorizedException('Invalid authorization header');
    }
    const b64auth = headerElements[1];
    if (!b64auth) {
      throw new UnauthorizedException('Invalid authorization header');
    }
    const [username] = Buffer.from(b64auth, 'base64').toString().split(':');
    if (!username || !THE_ONLY_BASIC_AUTH_USER) {
      throw new UnauthorizedException();
    }
    if (username !== THE_ONLY_BASIC_AUTH_USER) {
      throw new UnauthorizedException();
    }
    const publicKey =
      AuthenticationGuard.requireValidPublicKeyPathParamInRequest(request);
    return this.upsertWallet(publicKey);
  }
}
