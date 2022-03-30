import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { WalletModule } from './wallet/wallet.module';

@Module({
  imports: [PrismaModule, WalletModule],
  providers: [],
})
export class AppModule {}
