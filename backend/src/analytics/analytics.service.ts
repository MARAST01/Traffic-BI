import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Accident } from '../accidents/schemas/accident.schema';
import { AnalyticsFilterDto } from './dto/analytics-filter.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Accident.name) private readonly factModel: Model<Accident>,
    @InjectConnection() private readonly connection: Connection, // 🔑 Para consultar las dimensiones
  ) {}

  // 🧠 Estrategia de Modelo de Estrella: Filtramos dimensiones primero
  async buildMatchQuery(filters: AnalyticsFilterDto): Promise<any> {
    const match: any = {};

    if (filters.severity) match.severity = filters.severity;
    if (filters.startDate || filters.endDate) {
      match.start_time = {};
      if (filters.startDate)
        match.start_time.$gte = new Date(filters.startDate);
      if (filters.endDate) match.start_time.$lte = new Date(filters.endDate);
    }

    // Buscar IDs de ubicación
    if (filters.state || filters.city) {
      const locQuery: any = {};
      if (filters.state) locQuery.state = filters.state.toLowerCase();
      if (filters.city) locQuery.city = filters.city.toLowerCase();
      const locations = await this.connection
        .collection('location_dim')
        .find(locQuery)
        .project({ _id: 1 })
        .toArray();
      match.location_key = { $in: locations.map((l) => l._id) };
    }

    // Buscar IDs de clima
    if (filters.weather) {
      const weather = await this.connection
        .collection('weather_dim')
        .find({ weather_type: filters.weather.toLowerCase() })
        .project({ _id: 1 })
        .toArray();
      match.weather_key = { $in: weather.map((w) => w._id) };
    }

    return match;
  }

  async getLocations() {
    return this.connection
      .collection('location_dim')
      .aggregate([
        {
          $group: {
            _id: { state: '$state', city: '$city', county: '$county' },
          },
        },
        { $limit: 500 },
        {
          $project: {
            _id: 0,
            state: '$_id.state',
            city: '$_id.city',
            county: '$_id.county',
          },
        },
      ])
      .toArray();
  }

  async getWeatherConditions() {
    return this.connection.collection('weather_dim').distinct('weather_type');
  }

  async getDateRange() {
    const minDoc = await this.factModel
      .find()
      .sort({ start_time: 1 })
      .limit(1)
      .lean();
    const maxDoc = await this.factModel
      .find()
      .sort({ start_time: -1 })
      .limit(1)
      .lean();
    return { min: minDoc[0]?.start_time, max: maxDoc[0]?.start_time };
  }

  async getKpis(filters: AnalyticsFilterDto) {
    const match = await this.buildMatchQuery(filters);

    const basicStats = await this.factModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          avgSev: { $avg: '$severity' },
        },
      },
    ]);

    const weatherStats = await this.factModel.aggregate([
      { $match: match },
      { $group: { _id: '$weather_key', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: 'weather_dim',
          localField: '_id',
          foreignField: '_id',
          as: 'weather',
        },
      },
      { $unwind: '$weather' },
    ]);

    return {
      totalAccidents: basicStats[0]?.total || 0,
      averageSeverity: Number((basicStats[0]?.avgSev || 0).toFixed(2)),
      affectedDistanceMi: 0, // ⚠️ Columna omitida en el ETL
      mostFrequentCondition: weatherStats[0]?.weather?.weather_type || 'N/A',
    };
  }

  async getTrend(filters: AnalyticsFilterDto) {
    const match = await this.buildMatchQuery(filters);
    return this.factModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$start_time' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', count: '$count' } },
    ]);
  }

  async getSeverityDistribution(filters: AnalyticsFilterDto) {
    const match = await this.buildMatchQuery(filters);
    return this.factModel.aggregate([
      { $match: match },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, severity: '$_id', count: '$count' } },
    ]);
  }

  async getHeatmap(filters: AnalyticsFilterDto) {
    const match = await this.buildMatchQuery(filters);
    const points = await this.factModel.aggregate([
      { $match: match },
      { $sort: { start_time: -1 } },
      { $limit: 5000 },
      {
        $lookup: {
          from: 'location_dim',
          localField: 'location_key',
          foreignField: '_id',
          as: 'loc',
        },
      },
      { $unwind: '$loc' },
    ]);

    return points.map((p) => [
      p.loc.coordinates.coordinates[1], // Lat
      p.loc.coordinates.coordinates[0], // Lng
      p.severity,
    ]);
  }
  async getTimeOfDay(filters: AnalyticsFilterDto) {
    const match = await this.buildMatchQuery(filters);

    // Agrupamos por la hora del día extraída del start_time
    return this.factModel.aggregate([
      { $match: match },
      { $group: { _id: { $hour: '$start_time' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, hour: '$_id', count: '$count' } },
    ]);
  }

  async getPoiImpact(filters: AnalyticsFilterDto) {
    const match = await this.buildMatchQuery(filters);

    // Hacemos lookup con la dimensión de infraestructura para ver los POIs
    const data = await this.factModel.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'infrastructure_dim',
          localField: 'infrastructure_key',
          foreignField: '_id',
          as: 'infra',
        },
      },
      { $unwind: '$infra' },
      {
        $group: {
          _id: null,
          traffic_signal: { $sum: { $cond: ['$infra.traffic_signal', 1, 0] } },
          crossing: { $sum: { $cond: ['$infra.crossing', 1, 0] } },
          junction: { $sum: { $cond: ['$infra.junction', 1, 0] } },
          stop: { $sum: { $cond: ['$infra.stop', 1, 0] } },
          station: { $sum: { $cond: ['$infra.station', 1, 0] } },
        },
      },
    ]);

    if (!data || data.length === 0) return [];

    const result = data[0];

    // Lo formateamos como un arreglo para que sea fácil de graficar en Angular
    return [
      { poi: 'Semáforo (Traffic Signal)', count: result.traffic_signal },
      { poi: 'Cruce (Crossing)', count: result.crossing },
      { poi: 'Intersección (Junction)', count: result.junction },
      { poi: 'Pare (Stop)', count: result.stop },
      { poi: 'Estación (Station)', count: result.station },
    ].sort((a, b) => b.count - a.count); // Ordenado de mayor a menor impacto
  }
}
