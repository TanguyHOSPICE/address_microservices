import { EnumAddressStatus } from '../../utils/enums/enums';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { EnumAddressType } from 'src/utils/enums/enums';

export type AddressDocument = HydratedDocument<Address>;

@Schema({ timestamps: true, versionKey: false })
export class Address {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user_id: mongoose.Types.ObjectId;

  @Prop()
  full_name?: string;

  @Prop({ type: String, required: true })
  street: string;

  @Prop({ type: String, required: true })
  city: string;

  @Prop({ type: String, required: true })
  postal_code: string;

  @Prop()
  state?: string;

  @Prop({ type: String, required: true })
  country: string;

  @Prop({ type: String })
  phone_number?: string;

  @Prop({ type: Boolean, default: false })
  is_default: boolean;
  @Prop({ enum: EnumAddressType, required: true })
  type: EnumAddressType;
  @Prop({ enum: EnumAddressStatus, required: true })
  status: EnumAddressStatus;
}

export const AddressSchema = SchemaFactory.createForClass(Address);
