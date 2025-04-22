import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Address } from './schema/address.schema';
import { Model } from 'mongoose';
import { CreateAddressDto } from './dtos/createAddress.dto';
import { lastValueFrom } from 'rxjs';
import { RpcCustomException } from 'src/exceptions/rpc-custom.exception';
import { EnumAddressStatus, EnumAddressType } from 'src/utils/enums';

@Injectable()
export class AddressesService {
  constructor(
    @InjectModel(Address.name)
    private readonly addressModel: Model<Address>,
    @Inject('NATS_GATEWAY') private readonly nats: ClientProxy,
  ) {}

  async create({
    user_id,
    ...CreateAddressDto
  }: CreateAddressDto): Promise<Address> {
    //check if the user_id exists in the users microservice
    const userExists = await lastValueFrom(
      this.nats.send('USER_GET_USER_BY_ID', { _id: user_id }),
    );

    if (!userExists) {
      throw new RpcCustomException(
        `User with id ${user_id} not found`,
        HttpStatus.NOT_FOUND,
        '404',
      );
    }
    //check if the address already exists for the user
    const addressExists = await this.addressModel.findOne({
      user_id,
      ...CreateAddressDto,
    });
    //Check if the address already exists for the user
    if (addressExists) {
      throw new RpcCustomException(
        `Address already exists for user with id ${user_id}`,
        HttpStatus.BAD_REQUEST,
        '400',
      );
    }

    // TODO: Check why this is not working
    //check if the user already has a default address
    const defaultAddress = await this.addressModel.findOne({
      user_id,
      // is_default: true,
    });
    if (defaultAddress.is_default === true) {
      //Ask the user if he wants to update the default address
      throw new RpcCustomException(
        `User with id ${user_id} already has a default address`,
        HttpStatus.BAD_REQUEST,
        '400',
      );
    }

    const newAddress = new this.addressModel({
      user_id,
      ...CreateAddressDto,
    });
    return await newAddress.save();
  }
}
