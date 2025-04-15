import { IsMongoId, IsString, IsOptional, IsBoolean } from 'class-validator';

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
}
