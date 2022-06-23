import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DialectController } from './dialect.controller';
import { DialectService } from './dialect.service';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [PrismaModule, WalletModule],
  providers: [DialectService],
  exports: [DialectService],
  controllers: [DialectController],
})
export class DialectModule {}
