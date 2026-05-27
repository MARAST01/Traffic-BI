import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'accidents_fact' })
export class Accident extends Document {
  @Prop() accident_id!: string;
  @Prop() severity!: number;
  @Prop() start_time!: Date;
  @Prop() date_key!: string;
  @Prop() location_key!: string;
  @Prop() weather_key!: string;
  @Prop() infrastructure_key!: string;
}

export const AccidentSchema = SchemaFactory.createForClass(Accident);
