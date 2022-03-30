import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

import { DappService } from './dapp.service';

@Module({
  imports: [PrismaModule],
  exports: [DappService],
  controllers: [],
})
export class WalletModule {}
