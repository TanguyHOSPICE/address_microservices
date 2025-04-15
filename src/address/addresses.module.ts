import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NatsClientModule } from 'src/nats-client/nats-client.module';
import { Address, AddressSchema } from './schema/address.schema';
import { AddressesService } from './addresses.service';
import { AddressesMicroserviceController } from './addresses.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Address.name, schema: AddressSchema, collection: 'addresses' },
    ]),
    NatsClientModule,
  ],
  controllers: [AddressesMicroserviceController],
  providers: [AddressesService],
})
export class AddressesModule {}
