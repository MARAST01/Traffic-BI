import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { ConfigService } from '@nestjs/config';

export interface RiskPredictDto {
  hour: number;
  month: number;
  day_of_week: number;
  weather_type: string;
  intensity: string;
  sunrise_sunset: string;
  is_windy: boolean;
  humidity_pct: number;
  visibility_mi: number;
  temperature_c: number;
  traffic_signal: boolean;
  junction: boolean;
  crossing: boolean;
}

export interface RiskPredictResponse {
  risk_probability: number;
  risk_level: 'high' | 'low';
  risk_pct: number;
  threshold: number;
  latency_ms: number;
}

@Injectable()
export class RiskPredictionService {
  private readonly riskApiUrl: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.riskApiUrl =
      this.config.get<string>('RISK_API_URL') ?? 'http://risk-api:8000';
  }

  async predict(dto: RiskPredictDto): Promise<RiskPredictResponse> {
    try {
      const response: AxiosResponse<RiskPredictResponse> = await firstValueFrom(
        this.http.post<RiskPredictResponse>(`${this.riskApiUrl}/predict`, dto),
      );
      return response.data;
    } catch {
      throw new HttpException(
        'El microservicio de predicción no está disponible',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
