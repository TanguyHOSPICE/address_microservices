import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { EnumAddressStatus, EnumAddressType } from 'src/utils/enums/enums';

export class CreateAddressDto {
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsOptional()
  @IsString({ message: '⚠️full_name must be a string if provided' })
  full_name?: string;

  @IsString()
  street: string;

  @IsString()
  city: string;

  @IsString()
  postal_code: string;

  @IsString()
  country: string;

  @IsOptional()
  @IsString()
  state?: string;
  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
  @IsEnum(EnumAddressType)
  type: EnumAddressType;
  @IsEnum(EnumAddressStatus)
  status: EnumAddressStatus;
}
