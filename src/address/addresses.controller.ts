import { Controller } from '@nestjs/common';
import { AddressesService } from './addresses.service';

@Controller()
export class AddressesMicroserviceController {
  constructor(private readonly addressesService: AddressesService) {}
}
