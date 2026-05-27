import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Accident } from './schemas/accident.schema';
import { AnalyticsFilterDto } from '../analytics/dto/analytics-filter.dto';
import { AnalyticsService } from '../analytics/analytics.service';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';

@Injectable()
export class AccidentsService {
  constructor(
    @InjectModel(Accident.name) private readonly factModel: Model<Accident>,
    private readonly analyticsService: AnalyticsService, // 🔑 Reutilizamos el constructor de queries
  ) {}

  async findPaginated(
    filters: AnalyticsFilterDto,
    page: number,
    limit: number,
    sortStr: string,
  ) {
    const match = await this.analyticsService.buildMatchQuery(filters);
    const skip = (page - 1) * limit;

    const data = await this.factModel.aggregate([
      { $match: match },
      { $sort: { start_time: -1 } }, // Orden por defecto
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'location_dim',
          localField: 'location_key',
          foreignField: '_id',
          as: 'loc',
        },
      },
      {
        $lookup: {
          from: 'weather_dim',
          localField: 'weather_key',
          foreignField: '_id',
          as: 'wth',
        },
      },
      { $unwind: { path: '$loc', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$wth', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: '$accident_id',
          Start_Time: '$start_time',
          Severity: '$severity',
          State: '$loc.state',
          City: '$loc.city',
          Weather_Condition: '$wth.weather_type',
        },
      },
    ]);

    const total = await this.factModel.countDocuments(match);
    return { data, total, page, limit };
  }

  async exportData(
    filters: AnalyticsFilterDto,
    format: 'xlsx' | 'pdf',
    res: Response,
  ) {
    // La exportación reutiliza la misma consulta pero con límite alto (ej. 20000)
    // Omitido para mantener la brevedad, la lógica es idéntica a findPaginated sin $skip/$limit
    res
      .status(400)
      .json({ message: 'Ruta en mantenimiento para adaptar al Star Schema' });
  }
}
