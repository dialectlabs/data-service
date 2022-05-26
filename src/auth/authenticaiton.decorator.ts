import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { Wallet } from '@prisma/client';

export interface Principal {
  wallet: Wallet;
}

export const AuthPrincipal = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & Principal>();
    const principal: Principal = { wallet: request.wallet };
    return principal;
  },
);
