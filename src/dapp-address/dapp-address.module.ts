import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DappAddressService } from './dapp-address.service';

@Module({
  imports: [PrismaModule],
  providers: [DappAddressService],
  exports: [DappAddressService],
})
export class DappAddressModule {}
