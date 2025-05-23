import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Address } from './schema/address.schema';
import mongoose, { Model } from 'mongoose';
import { CreateAddressDto } from './dtos/createAddress.dto';
import { lastValueFrom } from 'rxjs';
import { RpcCustomException } from 'src/exceptions/rpc-custom.exception';
import { QueriesAddressDto } from './dtos/queriesAddress.dto';
import { IgroupedAddresses } from 'src/utils/interfaces/interfaces';
import { UpdateAddressDto } from './dtos/updateAddress.dto';
import { EnumAddressStatus } from 'src/utils/enums/enums';

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
    // console.log(
    //   '🔎~ AddressesService ~ Received DTO in service => user_id',
    //   user_id,
    // ); // ! dev tool

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

  async getAllAddresses(query?: QueriesAddressDto): Promise<IgroupedAddresses> {
    const {
      _id,
      user_id,
      is_default,
      full_name,
      street,
      city,
      state,
      country,
      postal_code,
      type,
      status,
    } = query || {};
    // console.log('🚀~ addressesService ~ getAllAddresses w/ a query:', query); // ! dev tool

    const filterConditions: any = {};

    if (_id) {
      filterConditions._id = _id;
    }
    if (user_id) {
      filterConditions.user_id = user_id;
    }
    if (is_default !== undefined) {
      filterConditions.is_default = is_default;
    }
    if (full_name) {
      filterConditions.full_name = { $regex: full_name, $options: 'i' };
    }
    if (street) {
      filterConditions.street = { $regex: street, $options: 'i' };
    }
    if (city) {
      filterConditions.city = { $regex: city, $options: 'i' };
    }
    if (state) {
      filterConditions.state = { $regex: state, $options: 'i' };
    }
    if (country) {
      filterConditions.country = { $regex: country, $options: 'i' };
    }
    if (postal_code) {
      filterConditions.postal_code = { $regex: postal_code, $options: 'i' };
    }
    if (type) {
      filterConditions.type = type;
    }
    if (status) {
      filterConditions.status = status;
    }

    const addresses = await this.addressModel.find(filterConditions).exec();

    if (addresses.length === 0) {
      console.log(
        '🧙🏽‍♂️ ~ AddressesService ~ getAllAddresses ~ addresses.length:',
        addresses.length,
      ); // ! dev tool
      throw new RpcCustomException(
        `No addresses found`,
        HttpStatus.NOT_FOUND,
        '404',
      );
    }

    // get the user ids from the addresses
    const userIds = addresses.map((address) => address.user_id);

    // Get all the addresses of addresses db
    const allAddresses = await this.addressModel.find({ user_id: userIds });

    // console.log(
    //   '🧙🏽‍♂️ ~ AddressesService ~ getAllAddresses ~ allAddresses:',
    //   allAddresses,
    // ); // ! dev tool

    let formattedAddresses: IgroupedAddresses = {};

    allAddresses.forEach((address) => {
      // Instanciate the minimal address object with the required fields
      const minimalAddress = {
        _id: address._id.toString(),
        street: address.street,
        city: address.city,
        state: address.state,
        country: address.country,
        postal_code: address.postal_code,
        type: address.type,
        status: address.status,
      };
      // Check if the user already exists in the formattedAddresses object
      if (!formattedAddresses[address.full_name]) {
        formattedAddresses[address.full_name] = [];
      }
      // Push the minimal address to the array of addresses for the user
      formattedAddresses[address.full_name].push(minimalAddress);
    });

    return formattedAddresses;
  }

  async getAddressById(addressId: string): Promise<Address> {
    const address = await this.addressModel.findById(addressId);
    console.log('🧙🏽‍♂️ ~ AddressesService ~ getAddressById ~ address:', address);

    if (!address) {
      throw new RpcCustomException(
        `Address with id ${addressId} not found`,
        HttpStatus.NOT_FOUND,
        '404',
      );
    }

    return address;
  }

  async update(
    addressId: string,
    updateAddressDto: UpdateAddressDto,
  ): Promise<Address> {
    const { is_default } = updateAddressDto;

    // === 👇 Check if the addressId exists
    const addressToUpdate = await this.addressModel.findById(addressId);

    if (!addressToUpdate) {
      throw new RpcCustomException(
        `Address with id ${addressId} not found`,
        HttpStatus.NOT_FOUND,
        '404',
      );
    }

    // === 👇 Check if the address is already set as default ===
    if (is_default !== undefined && is_default === true) {
      const existingDefaultAddress = await this.addressModel.findOne({
        user_id: addressToUpdate.user_id,
        is_default: true,
        _id: { $ne: addressId }, // Exclude the current address from the search
      });

      if (existingDefaultAddress) {
        throw new RpcCustomException(
          `Another address is already set as default for user ${addressToUpdate.user_id}`,
          HttpStatus.BAD_REQUEST,
          '400',
        );
      }
    }

    // === 👇 Update address ===
    const updatedAddress = await this.addressModel.findByIdAndUpdate(
      addressId,
      { $set: updateAddressDto },
      { new: true }, // Return the updated document
    );

    // === 👇 Check if the address is set as default and update other addresses accordingly
    if (updatedAddress.is_default) {
      await this.addressModel.updateMany(
        { user_id: updatedAddress.user_id, _id: { $ne: updatedAddress._id } },
        { $set: { is_default: false } },
      );
    }

    return updatedAddress;
  }

  // ! Soft delete: Update the status to "archived"
  async deleteToArchived(addressId: string): Promise<Address> {
    const address = await this.addressModel.findById(addressId);

    if (!address) {
      throw new RpcCustomException(
        `Address with id ${addressId} not found`,
        HttpStatus.NOT_FOUND,
        '404',
      );
    }

    // Check if the address is default
    if (address.is_default) {
      throw new RpcCustomException(
        `Cannot archive a default address. Please set another address as default first.`,
        HttpStatus.BAD_REQUEST,
        '400',
      );
    }

    // Mise à jour du statut à "archived"
    address.status = EnumAddressStatus.ARCHIVED;
    await address.save();

    return address;
  }

  // Hard delete: Remove the address from the database
  async delete(addressId: string): Promise<Address> {
    // === 👇
    const delAddress = await this.addressModel.findByIdAndDelete(addressId);
    // console.log('🧙🏽‍♂️ ~ AddressesService ~ delete ~ address:', delAddress); // ! dev tool
    // === 👇 Check if the addressId exists ===
    if (!delAddress) {
      throw new RpcCustomException(
        `Address with id ${addressId} not found`,
        HttpStatus.NOT_FOUND,
        '404',
      );
    }

    // === 🔄 Update user addresses field to remove the deleted address id
    await lastValueFrom(
      this.nats.send('USER_UPDATE', {
        _id: delAddress.user_id,
        update: {
          $pull: { addresses: delAddress._id },
        },
      }),
    );

    return delAddress;
  }
}
