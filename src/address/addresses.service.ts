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
    // console.log('🔎 Received DTO in service:', CreateAddressDto); // ! dev tool

    //check if the user_id exists in the users microservice
    const userExists = await lastValueFrom(
      this.nats.send('USER_GET_USER_BY_ID', { _id: user_id }),
    );
    // console.log('🧙🏽‍♂️ ~ AddressesService ~ userExists:', userExists); // ! dev tool
    // console.log('🧙🏽‍♂️ ~ AddressesService ~ userExists._id:', userExists._id); // ! dev tool

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

    // set the user firstname and last name to the full_name field
    CreateAddressDto.full_name = `${userExists.firstname} ${userExists.lastname}`;
    // console.log(
    //   '🧙🏽‍♂️ ~ AddressesService ~ CreateAddressDto.full_name:',
    //   CreateAddressDto.full_name,
    // ); // ! dev tool

    //Check if the address already exists for the user
    if (addressExists) {
      throw new RpcCustomException(
        `Address already exists for user with id ${user_id}`,
        HttpStatus.BAD_REQUEST,
        '400',
      );
    }

    //Check if the user already has a default address
    // const defaultAddress = await this.addressModel.findOne({
    //   user_id,
    //   is_default: true,
    // }); // ! dev tool
    // console.log('🧙🏽‍♂️ ~ AddressesService ~ defaultAddress:', defaultAddress); // ! dev tool

    // If the new address is set as default, unset the previous default address
    if (CreateAddressDto.is_default) {
      await this.addressModel.updateMany(
        { user_id, is_default: true },
        { $set: { is_default: false } },
      );
    }
    // console.log(
    //   '🧙🏽‍♂️ ~ AddressesService ~ defaultAddress modifying the others:',
    //   defaultAddress,
    // ); // ! dev tool

    // //update the addresses user field to add the new address id
    // await lastValueFrom(
    //   this.nats.send('USER_ADD_ADDRESS_ID', {
    //     user_id,
    //     address_id: CreateAddressDto._id,
    //   }),
    // );

    const newAddress = new this.addressModel({
      user_id: userExists._id.toString(),
      ...CreateAddressDto,
    });
    // console.log(
    //   '🧙🏽‍♂️ ~ AddressesService ~ newAddress.user_id:',
    //   newAddress.user_id,
    // ); // ! dev tool

    const savedAddress = await newAddress.save();

    // 🔄 Update the user addresses field with the new address id
    await lastValueFrom(
      this.nats.send('USER_UPDATE', {
        _id: user_id,
        update: {
          $addToSet: { addresses: savedAddress._id },
        },
      }),
    );

    return savedAddress;
  }
}
