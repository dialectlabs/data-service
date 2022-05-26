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
    const { wallet } = context.switchToHttp().getRequest<Request & Principal>();
    const dapp = await this.prisma.dapp.findUnique({
      where: {
        publicKey: wallet.publicKey,
      },
    });

    if (!dapp) {
      throw new UnauthorizedException(
        `DApp ${wallet.publicKey} not registered in the system.`,
      );
    }
    return true;
  }
}
