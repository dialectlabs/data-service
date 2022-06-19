import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

import { DappService } from './dapp.service';
import { DappControllerV0 } from './dapp.controller.v0';
import { DappControllerV1 } from './dapp.controller.v1';

@Module({
  imports: [PrismaModule],
  providers: [DappService],
  exports: [DappService],
  controllers: [DappControllerV0, DappControllerV1],
})
export class DappModule {}
