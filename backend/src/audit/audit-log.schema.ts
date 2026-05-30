import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ collection: 'audit_logs', timestamps: false })
export class AuditLog {
  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  userEmail!: string;

  @Prop({ required: true })
  userName!: string;

  @Prop({ required: true })
  userRole!: string;

  // Subdocumento plano con type: Object — Mongoose lo almacena tal cual
  // sin intentar validar campos individuales
  @Prop({
    type: {
      year: { type: String, default: 'Todos' },
      month: { type: String, default: 'Todos' },
      state: { type: String, default: 'Todos' },
      severity: { type: String, default: 'Todos' },
      weather: { type: String, default: 'Todos' },
    },
    required: true,
    default: () => ({
      year: 'Todos',
      month: 'Todos',
      state: 'Todos',
      severity: 'Todos',
      weather: 'Todos',
    }),
  })
  filters!: {
    year?: string;
    month?: string;
    state?: string;
    severity?: string;
    weather?: string;
  };

  @Prop({ required: true })
  page!: string;

  @Prop({ required: true, default: () => new Date() })
  createdAt!: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ createdAt: -1 });
