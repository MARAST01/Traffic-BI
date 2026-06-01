// ia/IA.ts  — Riesgo de Accidente  (versión con API real)
import {
  Component, OnInit, OnDestroy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule }                  from '@angular/common';
import { FormsModule }                   from '@angular/forms';
import { HttpClientModule }              from '@angular/common/http';
import { Subscription }                  from 'rxjs';
import { IaService, PredictRequest }     from './ia.service';
import type { PredictResponse }          from './ia.service';

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACES del dashboard (sin cambios respecto al original)
// ─────────────────────────────────────────────────────────────────────────────

export interface WeatherData {
  temperature: number;
  humidity:    number;
  windSpeed:   number;
  condition:   'rain' | 'fog' | 'clear' | 'storm' | 'cloud' | 'snow';
  visibility:  number;
}

export interface RiskFactor {
  name:        string;
  impact:      'low' | 'medium' | 'high';
  description: string;
}

export interface AccidentRiskResponse {
  riskScore:   number;
  riskLevel:   'low' | 'medium' | 'high' | 'critical';
  factors:     RiskFactor[];
  weather:     WeatherData;
  timestamp:   string;
  zone:        string;
  // ── Campos extra que vienen del modelo predictivo ──
  riskProbability?: number;
  riskPct?:         number;
  latencyMs?:       number;
  threshold?:       number;
}

// ─────────────────────────────────────────────────────────────────────────────
// FORM MODEL — los 13 campos requeridos por la API
// ─────────────────────────────────────────────────────────────────────────────

export interface PredictForm {
  // Tiempo
  hour:        number;
  month:       number;
  dayOfWeek:   number;
  sunriseSunset: 'day' | 'night';
  // Clima
  weatherType: 'rain' | 'fog' | 'clear' | 'storm' | 'cloud' | 'snow';
  intensity:   'light' | 'moderate' | 'heavy';
  isWindy:     boolean;
  humidityPct: number;
  visibilityMi: number;
  temperatureC: number;
  // Infraestructura
  trafficSignal: boolean;
  junction:      boolean;
  crossing:      boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector:     'app-ia',
  standalone:    true,
  imports:      [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './IA.html',
  styleUrl:    './IA.scss',
})
export class IA implements OnInit, OnDestroy {

  // ── Estado del dashboard ────────────────────────────────────────────────
  isLoading     = false;
  hasError      = false;
  errorMessage  = '';
  data: AccidentRiskResponse | null = null;
  displayScore  = 0;

  // ── Estado del formulario ───────────────────────────────────────────────
  showForm      = true;   // se oculta automáticamente tras el primer resultado

  form: PredictForm = this.defaultForm();

  // ── Internos ─────────────────────────────────────────────────────────────
  private animationFrame: number | null = null;
  private sub: Subscription | null      = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private iaService: IaService,
  ) {}

  ngOnInit(): void {
    // Prellenar hora y mes actuales para comodidad del usuario
    const now = new Date();
    this.form.hour  = now.getHours();
    this.form.month = now.getMonth() + 1;
    this.form.dayOfWeek = now.getDay();
    this.form.sunriseSunset = (now.getHours() >= 6 && now.getHours() < 20) ? 'day' : 'night';
  }

  ngOnDestroy(): void {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    if (this.sub) this.sub.unsubscribe();
  }

  // ── Formulario ────────────────────────────────────────────────────────────

  private defaultForm(): PredictForm {
    return {
      hour:          12,
      month:          1,
      dayOfWeek:      0,
      sunriseSunset: 'day',
      weatherType:   'clear',
      intensity:     'light',
      isWindy:        false,
      humidityPct:    50,
      visibilityMi:   5,
      temperatureC:   20,
      trafficSignal:  false,
      junction:       false,
      crossing:       false,
    };
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
  }

  // ── Llamada a la API ─────────────────────────────────────────────────────

  loadRiskData(): void {
    this.isLoading   = true;
    this.hasError    = false;
    this.errorMessage = '';
    this.displayScore = 0;
    this.data         = null;

    const payload: PredictRequest = this.buildPayload();

    if (this.sub) this.sub.unsubscribe();

    this.sub = this.iaService.predict(payload).subscribe({
      next:  (res) => this.handleSuccess(res, payload),
      error: (err: Error) => this.handleError(err),
    });
  }

  // ── Mapeo Form → API body ─────────────────────────────────────────────────
  // Tabla de equivalencias:
  //   form.humidityPct    →  humidity_pct      (sin conversión, ya en %)
  //   form.visibilityMi   →  visibility_mi     (el usuario ingresa en millas)
  //   form.temperatureC   →  temperature_c     (°C)
  //   form.weatherType    →  weather_type
  //   form.isWindy        →  is_windy
  //   form.sunriseSunset  →  sunrise_sunset
  //   form.trafficSignal  →  traffic_signal
  //   form.dayOfWeek      →  day_of_week

  private buildPayload(): PredictRequest {
    return {
      hour:           this.form.hour,
      month:          this.form.month,
      day_of_week:    this.form.dayOfWeek,
      weather_type:   this.form.weatherType,
      intensity:      this.form.intensity,
      sunrise_sunset: this.form.sunriseSunset,
      is_windy:       this.form.isWindy,
      humidity_pct:   this.form.humidityPct,
      visibility_mi:  this.form.visibilityMi,
      temperature_c:  this.form.temperatureC,
      traffic_signal: this.form.trafficSignal,
      junction:       this.form.junction,
      crossing:       this.form.crossing,
    };
  }

  // ── Transformar respuesta al modelo del dashboard ────────────────────────
  private handleSuccess(res: PredictResponse, payload: PredictRequest): void {
    const visibilityKm = +(payload.visibility_mi * 1.60934).toFixed(1);
    const windSpeed    = payload.is_windy ? 35 : 12; // estimado visual

    this.data = {
      riskScore:        Math.round(res.risk_pct),
      riskLevel:        res.risk_level,
      zone:            'Análisis en tiempo real',
      timestamp:        new Date().toISOString(),
      riskProbability:  res.risk_probability,
      riskPct:          res.risk_pct,
      latencyMs:        res.latency_ms,
      threshold:        res.threshold,
      weather: {
        temperature: payload.temperature_c,
        humidity:    payload.humidity_pct,
        windSpeed,
        condition:   payload.weather_type,
        visibility:  visibilityKm,
      },
      factors: this.buildFactorsFromPayload(payload, res),
    };

    this.isLoading = false;
    this.showForm  = false;
    this.animateScore(this.data.riskScore);
    this.cdr.detectChanges();
  }

  private handleError(err: Error): void {
    this.hasError     = true;
    this.isLoading    = false;
    this.errorMessage = err.message;
    this.cdr.detectChanges();
  }

  // ── Generar factores de riesgo a partir de los parámetros enviados ────────
  private buildFactorsFromPayload(
    p: PredictRequest,
    res: PredictResponse,
  ): RiskFactor[] {
    const factors: RiskFactor[] = [];

    // Clima
    const weatherImpact: 'high' | 'medium' | 'low' =
      p.weather_type === 'storm' ? 'high' :
      ['rain', 'fog', 'snow'].includes(p.weather_type) ? 'medium' : 'low';
    factors.push({
      name:        this.weatherConditionLabelByType(p.weather_type),
      impact:      weatherImpact,
      description: `Intensidad ${p.intensity === 'heavy' ? 'fuerte' : p.intensity === 'moderate' ? 'moderada' : 'leve'} · Visibilidad ${(p.visibility_mi * 1.60934).toFixed(1)} km`,
    });

    // Humedad
    if (p.humidity_pct >= 80) {
      factors.push({
        name:        'Humedad elevada',
        impact:      p.humidity_pct >= 90 ? 'high' : 'medium',
        description: `${p.humidity_pct}% de humedad relativa. Pavimento potencialmente resbaladizo.`,
      });
    }

    // Viento
    if (p.is_windy) {
      factors.push({
        name:        'Vientos fuertes',
        impact:      'medium',
        description: 'Condición de viento detectada. Reducir velocidad en zonas abiertas.',
      });
    }

    // Infraestructura
    if (p.junction) {
      factors.push({
        name:        'Intersección vial',
        impact:      'medium',
        description: 'Zona de confluencia de vehículos con mayor probabilidad de colisión.',
      });
    }
    if (p.crossing) {
      factors.push({
        name:        'Cruce peatonal',
        impact:      'low',
        description: 'Presencia de cruce peatonal activo en el área evaluada.',
      });
    }

    // Hora nocturna
    if (p.sunrise_sunset === 'night') {
      factors.push({
        name:        'Hora nocturna',
        impact:      'medium',
        description: `Visibilidad reducida por condición nocturna (${p.hour}:00 hrs).`,
      });
    }

    // Si el modelo retorna alto/crítico y no hay suficientes factores
    if (factors.length < 2 && (res.risk_level === 'high' || res.risk_level === 'critical')) {
      factors.push({
        name:        'Riesgo combinado',
        impact:      'high',
        description: `El modelo detectó combinación de factores que elevan el riesgo a ${res.risk_pct.toFixed(1)}%.`,
      });
    }

    return factors.length ? factors : [{
      name:        'Sin factores críticos',
      impact:      'low',
      description: 'Las condiciones actuales no presentan riesgos significativos.',
    }];
  }

  // ── Gauge helpers ─────────────────────────────────────────────────────────

  getProgressDash(score: number): string {
    const c = 2 * Math.PI * 100;
    return `${((score / 100) * (270 / 360) * c).toFixed(1)} ${c.toFixed(1)}`;
  }

  readonly progressOffset = (() => {
    const c = 2 * Math.PI * 100;
    return (c * (225 / 360)).toFixed(1);
  })();

  readonly trackDash = (() => {
    const c = 2 * Math.PI * 100;
    return `${((270 / 360) * c).toFixed(1)} ${c.toFixed(1)}`;
  })();

  getNeedleRotation(score: number): number {
    const safeScore   = Math.max(0, Math.min(100, score));
    const startAngle  = -135;
    const totalDegrees = 270;
    return startAngle + (safeScore / 100) * totalDegrees;
  }

  private animateScore(target: number): void {
    const start    = performance.now();
    const duration = 1200;
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      this.displayScore = Math.round((1 - Math.pow(1 - t, 3)) * target);
      this.cdr.detectChanges();
      if (t < 1) this.animationFrame = requestAnimationFrame(step);
    };
    this.animationFrame = requestAnimationFrame(step);
  }

  // ── Display helpers ───────────────────────────────────────────────────────

  riskLevelLabel(): string {
    const map: Record<string, string> = {
      low: 'BAJO', medium: 'MODERADO', high: 'ALTO', critical: 'CRÍTICO',
    };
    return this.data ? (map[this.data.riskLevel] ?? '') : '';
  }

  weatherConditionLabel(): string {
    return this.data
      ? this.weatherConditionLabelByType(this.data.weather.condition)
      : '';
  }

  private weatherConditionLabelByType(c: string): string {
    const map: Record<string, string> = {
      rain: 'Lluvia', storm: 'Tormenta', fog: 'Niebla',
      clear: 'Despejado', cloud: 'Nublado', snow: 'Nieve',
    };
    return map[c] ?? c;
  }

  impactBadgeClass(impact: string): string {
    return `badge badge--${impact}`;
  }

  trackByName(_: number, f: RiskFactor): string { return f.name; }

  // ── Labels para el formulario ─────────────────────────────────────────────

  readonly dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  readonly monthNames = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
  ];
}
