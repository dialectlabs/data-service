import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { Wallet as WalletDb } from '@prisma/client';

export type RequestScopedWallet = Request & { wallet: WalletDb };

export const InjectWallet = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestScopedWallet>();
    return request.wallet;
  },
);
