import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: 'rain' | 'fog' | 'clear' | 'storm' | 'cloud' | 'snow';
  visibility: number;
}

export interface RiskFactor {
  name: string;
  impact: 'low' | 'medium' | 'high';
  description: string;
}

export interface AccidentRiskResponse {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  weather: WeatherData;
  timestamp: string;
  zone: string;
}

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  MOCK DATA — Eliminar este bloque para conectar al backend              ║
// ║  En loadRiskData() reemplazar la línea de getMockRiskData() con:        ║
// ║    this.data = await firstValueFrom(                                    ║
// ║      this.http.get<AccidentRiskResponse>('/api/v1/accident-risk')       ║
// ║    );                                                                   ║
// ╚══════════════════════════════════════════════════════════════════════════╝
const MOCK_RISK_DATA: AccidentRiskResponse = {
  riskScore:  67,
  riskLevel: 'high',
  zone:      'Zona Centro – Zarzal, Valle',
  timestamp:  new Date().toISOString(),
  weather: {
    temperature: 18,
    humidity:    82,
    windSpeed:   24,
    condition:  'rain',
    visibility:  2.1,
  },
  factors: [
    { name: 'Lluvia intensa',       impact: 'high',   description: 'Visibilidad reducida a 2 km en Av. Principal' },
    { name: 'Hora pico vespertina', impact: 'medium', description: 'Flujo vehicular 3× por encima del promedio' },
    { name: 'Vía en reparación',    impact: 'medium', description: 'Carril derecho cerrado entre Cll 5 y Cll 8' },
    { name: 'Temperatura baja',     impact: 'low',    description: 'Posible pavimento húmedo en zonas sin drenaje' },
  ],
};
// ╚══════════════════════════════════ FIN MOCK ══════════════════════════════╝

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-ia',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './IA.html',
  styleUrl: './IA.scss',
})
export class IA implements OnInit, OnDestroy {

  isLoading    = true;
  hasError     = false;
  data: AccidentRiskResponse | null = null;
  displayScore = 0;

  private animationFrame: number | null = null;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadRiskData();
    this.refreshTimer = setInterval(() => this.loadRiskData(), 5 * 60 * 1000);
  }

  ngOnDestroy(): void {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    if (this.refreshTimer)   clearInterval(this.refreshTimer);
  }

  loadRiskData(): void {
    this.isLoading    = true;
    this.hasError     = false;
    this.displayScore = 0;
    this.data         = null;

    // ── MOCK: asignación directa sin async/await ni setTimeout ──
    // Eliminar estas 4 líneas al conectar al backend real
    this.data      = { ...MOCK_RISK_DATA, timestamp: new Date().toISOString() };
    this.isLoading = false;
    this.animateScore(this.data.riskScore);
    this.cdr.detectChanges();
    // ── FIN MOCK ──

    // ── BACKEND REAL: descomentar este bloque y eliminar el bloque MOCK ──
    // this.http.get<AccidentRiskResponse>('/api/v1/accident-risk').subscribe({
    //   next: (res) => {
    //     this.data      = res;
    //     this.isLoading = false;
    //     this.animateScore(res.riskScore);
    //     this.cdr.detectChanges();
    //   },
    //   error: () => {
    //     this.hasError  = true;
    //     this.isLoading = false;
    //     this.cdr.detectChanges();
    //   },
    // });
    // ── FIN BACKEND REAL ──
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
  // 1. Forzar que el score esté en el rango permitido (0 - 100)
  const safeScore = Math.max(0, Math.min(100, score));
  
  // 2. Mapear el rango de 0 a 100 hacia el rango de -135 a +135 grados
  // Cuando safeScore = 0   ->   -135 grados
  // Cuando safeScore = 50  ->      0 grados
  // Cuando safeScore = 100 ->   +135 grados
  const startAngle = -135;
  const totalDegrees = 270;
  
  return startAngle + (safeScore / 100) * totalDegrees;
}

  // ── Display helpers ───────────────────────────────────────────────────────

  riskLevelLabel(): string {
    const map: Record<string, string> = {
      low: 'BAJO', medium: 'MODERADO', high: 'ALTO', critical: 'CRÍTICO',
    };
    return this.data ? (map[this.data.riskLevel] ?? '') : '';
  }

  weatherConditionLabel(): string {
    const map: Record<string, string> = {
      rain: 'Lluvia', storm: 'Tormenta', fog: 'Niebla',
      clear: 'Despejado', cloud: 'Nublado', snow: 'Nieve',
    };
    return this.data ? (map[this.data.weather.condition] ?? '') : '';
  }

  impactBadgeClass(impact: string): string {
    return `badge badge--${impact}`;
  }

  trackByName(_: number, f: RiskFactor): string { return f.name; }
}