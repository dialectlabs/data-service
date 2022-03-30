import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { WalletModule } from './wallet/wallet.module';
import { DappModule } from './dapp/dapp.module';

@Module({
  imports: [PrismaModule, WalletModule, DappModule],
  providers: [],
})
export class AppModule {}
