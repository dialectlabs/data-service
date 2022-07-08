import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { Dapp, Wallet } from '@prisma/client';

export interface Principal {
  wallet: Wallet;
}

export interface DappPrincipal {
  dapp: Dapp;
  wallet: Wallet;
}

export const AuthPrincipal = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & Principal>();
    const principal: Principal = { wallet: request.wallet };
    return principal;
  },
);

export const DappAuthPrincipal = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & Principal & DappPrincipal>();
    const principal: DappPrincipal = {
      wallet: request.wallet,
      dapp: request.dapp,
    };
    return principal;
  },
);
