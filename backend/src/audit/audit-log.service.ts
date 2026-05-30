import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './audit-log.schema';

export interface CreateAuditLogDto {
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
  filters: {
    year?: string;
    month?: string;
    state?: string;
    severity?: string;
    weather?: string;
  };
  page: string;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  async create(dto: CreateAuditLogDto): Promise<AuditLog> {
    const log = new this.auditLogModel({
      ...dto,
      createdAt: new Date(),
    });
    return log.save();
  }

  async findAll(
    page = 1,
    limit = 20,
  ): Promise<{ data: AuditLog[]; total: number }> {
    const [data, total] = await Promise.all([
      this.auditLogModel
        .find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.auditLogModel.countDocuments(),
    ]);
    return { data, total };
  }
}
