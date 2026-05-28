import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AnalyticsQueryParams,
  BackendKpis,
  TrendPointDto,
  SeverityPointDto,
  HourlyPointDto,
  StateRankingDto,
  WeatherPointDto,
  PoiImpactDto,
  HeatmapPoint,
  FilterDateRange,
  FilterLocation,
} from '../models/analytics-api.model';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/analytics`;

  private buildParams(filters: AnalyticsQueryParams): HttpParams {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return params;
  }

  getFilterLocations(): Observable<FilterLocation[]> {
    return this.http.get<FilterLocation[]>(`${this.base}/filters/locations`);
  }

  getFilterWeather(): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/filters/weather`);
  }

  getFilterDateRange(): Observable<FilterDateRange> {
    return this.http.get<FilterDateRange>(`${this.base}/filters/date-range`);
  }

  getKpis(filters: AnalyticsQueryParams): Observable<BackendKpis> {
    return this.http.get<BackendKpis>(`${this.base}/kpis`, {
      params: this.buildParams(filters),
    });
  }

  getTrend(filters: AnalyticsQueryParams): Observable<TrendPointDto[]> {
    return this.http.get<TrendPointDto[]>(`${this.base}/charts/trend`, {
      params: this.buildParams(filters),
    });
  }

  getSeverityDistribution(filters: AnalyticsQueryParams): Observable<SeverityPointDto[]> {
    return this.http.get<SeverityPointDto[]>(`${this.base}/charts/severity-distribution`, {
      params: this.buildParams(filters),
    });
  }

  getTimeOfDay(filters: AnalyticsQueryParams): Observable<HourlyPointDto[]> {
    return this.http.get<HourlyPointDto[]>(`${this.base}/charts/time-of-day`, {
      params: this.buildParams(filters),
    });
  }

  getStateRanking(filters: AnalyticsQueryParams): Observable<StateRankingDto[]> {
    return this.http.get<StateRankingDto[]>(`${this.base}/charts/state-ranking`, {
      params: this.buildParams(filters),
    });
  }

  getWeatherDistribution(filters: AnalyticsQueryParams): Observable<WeatherPointDto[]> {
    return this.http.get<WeatherPointDto[]>(`${this.base}/charts/weather-distribution`, {
      params: this.buildParams(filters),
    });
  }

  getPoiImpact(filters: AnalyticsQueryParams): Observable<PoiImpactDto[]> {
    return this.http.get<PoiImpactDto[]>(`${this.base}/charts/poi-impact`, {
      params: this.buildParams(filters),
    });
  }

  getHeatmap(filters: AnalyticsQueryParams): Observable<HeatmapPoint[]> {
    return this.http.get<HeatmapPoint[]>(`${this.base}/map/heatmap`, {
      params: this.buildParams(filters),
    });
  }
}
