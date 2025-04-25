import { Address, AddressSchema } from './schema/address.schema';
import { Controller } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateAddressDto } from './dtos/createAddress.dto';
import { QueriesAddressDto } from './dtos/queriesAddress.dto';
import { IgroupedAddresses } from 'src/utils/interfaces/interfaces';
import { UpdateAddressDto } from './dtos/updateAddress.dto';

@Controller('addresses')
export class AddressesMicroserviceController {
  constructor(private readonly addressesService: AddressesService) {}

  @MessagePattern('CREATE_ADDRESS')
  async createAddress(@Payload() data: CreateAddressDto): Promise<Address> {
    return this.addressesService.create(data);
  }

  @MessagePattern('GET_ALL_ADDRESSES')
  async getAllAddresses(
    @Payload() query: QueriesAddressDto,
  ): Promise<IgroupedAddresses> {
    // console.log(
    //   '📩~ AddressMicroserviceController ~ Received  all addresses by query',
    //   query,
    // ); // ! dev tool
    return this.addressesService.getAllAddresses(query);
  }

  @MessagePattern('UPDATE_ADDRESS') // MessagePattern pour la mise à jour d'une adresse
  async updateAddress(
    @Payload() data: { addressId: string; updateData: UpdateAddressDto },
  ): Promise<Address> {
    const { addressId, updateData } = data;
    return this.addressesService.update(addressId, updateData);
  }
}
