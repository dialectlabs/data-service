import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DialectController } from './dialect.controller';
import { DialectService } from './dialect.service';
import { MessageService } from './message.service';
import { DappModule } from '../dapp/dapp.module';

@Module({
  imports: [PrismaModule, DappModule],
  providers: [DialectService, MessageService],
  exports: [DialectService, MessageService],
  controllers: [DialectController],
})
export class DialectModule {}
