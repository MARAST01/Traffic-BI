import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export type UserRole = 'Gerente' | 'Analista' | 'Administrador';
export type UserStatus = 'Activo' | 'Inactivo';

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ required: true, enum: ['Gerente', 'Analista', 'Administrador'] })
  role!: UserRole;

  @Prop({ default: 'Activo', enum: ['Activo', 'Inactivo'] })
  status!: UserStatus;
}

export const UserSchema = SchemaFactory.createForClass(User);
