import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

import { DappService } from './dapp.service';
import { DappController } from './dapp.controller';

@Module({
  imports: [PrismaModule],
  providers: [DappService],
  exports: [DappService],
  controllers: [DappController],
})
export class DappModule {}
