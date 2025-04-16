import {
  IsMongoId,
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { EnumAddressStatus, EnumAddressType } from 'src/utils/enums';

export class CreateAddressDto {
  @IsMongoId()
  user_id: string;

  @IsString()
  full_name: string;

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
  phone_number?: string;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
  @IsEnum(EnumAddressType)
  type: EnumAddressType;
  @IsEnum(EnumAddressStatus)
  status: EnumAddressStatus;
}
