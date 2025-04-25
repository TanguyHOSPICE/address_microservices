import { IsOptional, IsString, IsBoolean, IsEnum } from 'class-validator';
import { EnumAddressStatus, EnumAddressType } from 'src/utils/enums/enums';

export class QueriesAddressDto {
  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  _id?: string;

  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  postal_code?: string;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsOptional()
  @IsEnum(EnumAddressType)
  type?: EnumAddressType;

  @IsOptional()
  @IsEnum(EnumAddressStatus)
  status?: EnumAddressStatus;
}
