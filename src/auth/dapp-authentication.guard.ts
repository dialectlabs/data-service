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
export class DappAuthenticationGuard implements CanActivate {
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
        `DApp ${publicKey.toBase58()} not registered in the system.`,
      );
    }
    return true;
  }
}
