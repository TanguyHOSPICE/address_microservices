import { Address, AddressSchema } from './schema/address.schema';
import { Controller } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateAddressDto } from './dtos/createAddress.dto';

@Controller()
export class AddressesMicroserviceController {
  constructor(private readonly addressesService: AddressesService) {}

  @MessagePattern('CREATE_ADDRESS')
  async createAddress(@Payload() data: CreateAddressDto): Promise<Address> {
    return await this.addressesService.create(data);
  }
}
