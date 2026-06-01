// ia/ia.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
// ─────────────────────────────────────────────────────────────────────────────
// REQUEST — campos que espera el modelo predictivo
// ─────────────────────────────────────────────────────────────────────────────

export type WeatherType     = 'rain' | 'fog' | 'clear' | 'storm' | 'cloud' | 'snow';
export type Intensity       = 'light' | 'moderate' | 'heavy';
export type SunriseSunset   = 'day' | 'night';

export interface PredictRequest {
  hour:            number;          // 0 – 23
  month:           number;          // 1 – 12
  day_of_week:     number;          // 0 Mon … 6 Sun
  weather_type:    WeatherType;
  intensity:       Intensity;
  sunrise_sunset:  SunriseSunset;
  is_windy:        boolean;
  humidity_pct:    number;          // 0 – 100
  visibility_mi:   number;          // miles
  temperature_c:   number;          // °C
  traffic_signal:  boolean;
  junction:        boolean;
  crossing:        boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSE — lo que devuelve el modelo
// ─────────────────────────────────────────────────────────────────────────────

export interface PredictResponse {
  risk_probability: number;   // 0.0 – 1.0
  risk_level:       'low' | 'medium' | 'high' | 'critical';
  risk_pct:         number;   // 0 – 100
  threshold:        number;
  latency_ms:       number;
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class IaService {

  private readonly endpoint = `${environment.predictUrl}/predict`;

  constructor(private http: HttpClient) {}

  predict(payload: PredictRequest): Observable<PredictResponse> {
    return this.http
      .post<PredictResponse>(this.endpoint, payload)
      .pipe(
        timeout(15_000),          // 15 s máximo de espera
        catchError(this.handleError),
      );
  }

  // ── Mapeo de campos del formulario al body requerido ─────────────────────
  //
  //  Formulario (IA.ts)              →   API body
  //  ─────────────────────────────────────────────────
  //  data.weather.condition          →   weather_type
  //  data.weather.temperature        →   temperature_c
  //  data.weather.humidity           →   humidity_pct
  //  data.weather.windSpeed > 30     →   is_windy
  //  data.weather.visibility * 0.621 →   visibility_mi  (km → mi)
  //  form.hour                       →   hour
  //  form.month                      →   month
  //  form.dayOfWeek                  →   day_of_week
  //  form.intensity                  →   intensity
  //  form.sunriseSunset              →   sunrise_sunset
  //  form.trafficSignal              →   traffic_signal
  //  form.junction                   →   junction
  //  form.crossing                   →   crossing

  private handleError(err: HttpErrorResponse | Error): Observable<never> {
    if (err instanceof HttpErrorResponse) {
      switch (err.status) {
        case 0:
          return throwError(() => new Error(
            'No se pudo conectar con el servidor. Verifica que el contenedor Docker esté corriendo en localhost:8000.',
          ));
        case 422:
          return throwError(() => new Error(
            'Los datos enviados no son válidos (422). Revisa el formato del formulario.',
          ));
        case 500:
          return throwError(() => new Error('Error interno del modelo (500).'));
        default:
          return throwError(() => new Error(`Error del servidor: ${err.status} ${err.statusText}`));
      }
    }
    // timeout u otro error de red
    if (err.message?.includes('Timeout')) {
      return throwError(() => new Error('La petición tardó demasiado. El modelo puede estar ocupado.'));
    }
    return throwError(() => err);
  }
}
