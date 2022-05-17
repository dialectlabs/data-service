import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { checkPublicKeyIsValid } from '../middleware/public-key-validation-pipe';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DappAuthorizationGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const publicKey = checkPublicKeyIsValid(
      request.params.public_key,
      'public_key',
    );

    const dapp = await this.prisma.dapp.findUnique({
      where: {
        publicKey: publicKey.toBase58(),
      },
    });

    if (!dapp) {
      throw new UnauthorizedException(
        `Operation is not authorized for dApp ${publicKey.toBase58()}.`,
      );
    }
    return true;
  }
}
