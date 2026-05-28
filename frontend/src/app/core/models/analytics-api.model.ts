/** Parámetros enviados al backend (AnalyticsFilterDto) */
export interface AnalyticsQueryParams {
  state?: string;
  city?: string;
  weather?: string;
  severity?: number;
  startDate?: string;
  endDate?: string;
}

export interface BackendKpis {
  totalAccidents: number;
  totalFatalities: number;
  avgPerDay: number;
  topState: string;
  topStateCount: number;
  averageSeverity: number;
  affectedDistanceMi: number;
  mostFrequentCondition: string;
}

export interface TrendPointDto {
  date: string;
  count: number;
}

export interface SeverityPointDto {
  severity: number;
  count: number;
}

export interface HourlyPointDto {
  hour: number;
  count: number;
}

export interface StateRankingDto {
  state: string;
  accidents: number;
  pct: number;
}

export interface WeatherPointDto {
  weather: string;
  count: number;
}

export interface PoiImpactDto {
  poi: string;
  count: number;
}

export type HeatmapPoint = [number, number, number];

export interface AccidentRowDto {
  _id: string;
  Start_Time: string;
  Severity: number;
  State: string;
  City: string;
  Weather_Condition: string;
}

export interface PaginatedAccidentsResponse {
  data: AccidentRowDto[];
  total: number;
  page: number;
  limit: number;
}

export interface FilterDateRange {
  min: string;
  max: string;
}

export interface FilterLocation {
  state: string;
  city: string;
  county: string;
}
