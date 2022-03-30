import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { Wallet } from '@prisma/client';

export const InjectWallet = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { wallet: Wallet }>();
    return request.wallet;
  },
);
