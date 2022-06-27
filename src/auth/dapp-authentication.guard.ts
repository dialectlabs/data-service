import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { Principal } from './authenticaiton.decorator';

@Injectable()
export class DappAuthenticationGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & Principal>();
    await this.prisma.dapp.findUnique({
      where: {
        publicKey: request.wallet.publicKey,
      },
      rejectOnNotFound: (e) => new UnauthorizedException(e.message),
    });
    return true;
  }
}
