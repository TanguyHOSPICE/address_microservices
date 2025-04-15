import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AddressesModule } from './address/addresses.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    // Mongoose connection to the database with the DNS in the .env file
    MongooseModule.forRoot(process.env.NOZAMA_ADDRESSES_DNS),
    AddressesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
