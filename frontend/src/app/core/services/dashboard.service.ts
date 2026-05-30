import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, forkJoin, catchError, of } from 'rxjs';
import { FiltersService } from './filters.service';
import { AnalyticsService } from './analytics.service';
import { AccidentsService } from './accidents.service';
import { filtersToQueryParams, formatSeverityLabel, formatWeatherLabel, monthLabelFromIsoDate, severityColor, weatherChartColor } from '../utils/filter-mapper';
import {
  KPIData,
  TrendPoint,
  StateData,
  HeatmapCell,
  FactorPoint,
  IncidentRow,
} from './mock-data.service';
import {
  BackendKpis,
  HourlyPointDto,
  PaginatedAccidentsResponse,
  TrendPointDto,
  StateRankingDto,
} from '../models/analytics-api.model';

export type DashboardPage =
  | 'overview'
  | 'geographic'
  | 'temporal'
  | 'factors'
  | 'tables';

const EMPTY_KPIS: KPIData = {
  totalAccidents: 0,
  totalFatalities: 0,
  avgPerDay: 0,
  topState: '—',
  topStateCount: 0,
};

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly filtersService = inject(FiltersService);
  private readonly analytics = inject(AnalyticsService);
  private readonly accidents = inject(AccidentsService);
  private readonly destroyRef = inject(DestroyRef);

  private activePage = signal<DashboardPage | null>(null);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly kpis = signal<KPIData>(EMPTY_KPIS);
  readonly monthlyTrend = signal<TrendPoint[]>([]);
  readonly severityDistribution = signal<FactorPoint[]>([]);
  readonly stateRanking = signal<StateData[]>([]);
  readonly heatmapCells = signal<HeatmapCell[]>([]);
  readonly hourlyTrend = signal<TrendPoint[]>([]);
  readonly weatherDistribution = signal<FactorPoint[]>([]);
  readonly tableData = signal<PaginatedAccidentsResponse | null>(null);

  constructor() {
    // La recarga ya no es automática: se dispara manualmente
    // desde el componente al presionar "Aplicar" en la barra de filtros.
  }

  /** Carga inicial silenciosa — sin mostrar el indicador de loading */
  connect(page: DashboardPage): void {
    this.activePage.set(page);
    this._reload(page, true);
  }

  /** Recarga manual (al presionar Aplicar) — muestra el indicador de loading */
  reload(page?: DashboardPage): void {
    const target = page ?? this.activePage();
    if (!target) return;
    if (page) this.activePage.set(page);
    this._reload(target, false);
  }

  disconnect(): void {
    this.activePage.set(null);
  }

  loadTablePage(page: number, limit = 6): void {
    const params = filtersToQueryParams(this.filtersService.filters());
    this.loading.set(true);
    this.accidents.getAccidents(params, page, limit).pipe(
      catchError(err => {
        this.error.set(this.extractError(err));
        return of({ data: [], total: 0, page: 1, limit });
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(res => {
      this.tableData.set(res);
      this.loading.set(false);
    });
  }

  exportReport(format: 'pdf' | 'xlsx'): void {
    if (format === 'pdf') {
      this.error.set('La exportación PDF aún no está disponible. Use Excel.');
      return;
    }
    const params = filtersToQueryParams(this.filtersService.filters());
    this.accidents.exportXlsx(params).pipe(
      catchError(err => {
        this.error.set(this.extractError(err));
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'accidentes-export.xlsx';
      anchor.click();
      URL.revokeObjectURL(url);
    });
  }

  tableRows(): IncidentRow[] {
    const res = this.tableData();
    if (!res) return [];
    return res.data.map(row => ({
      date: new Date(row.Start_Time).toLocaleDateString('es-CO'),
      area: `${this.titleCase(row.State)} · ${this.titleCase(row.City)}`,
      severity: formatSeverityLabel(row.Severity),
      weather: formatWeatherLabel(row.Weather_Condition),
      accidents: 1,
      fatalities: row.Severity === 4 ? 1 : 0,
      riskScore: row.Severity * 25,
    }));
  }

  tableTotal(): number {
    return this.tableData()?.total ?? 0;
  }

  private _reload(page: DashboardPage, silent = false): void {
    const params = filtersToQueryParams(this.filtersService.filters());
    if (!silent) this.loading.set(true);
    this.error.set(null);

    switch (page) {
      case 'overview':
        this.loadOverview(params);
        break;
      case 'geographic':
        this.loadGeographic(params);
        break;
      case 'temporal':
        this.loadTemporal(params);
        break;
      case 'factors':
        this.loadFactors(params);
        break;
      case 'tables':
        this.loadTablePage(1, 6);
        break;
    }
  }

  private loadOverview(params: ReturnType<typeof filtersToQueryParams>): void {
    forkJoin({
      kpis: this.analytics.getKpis(params).pipe(
        catchError(err => {
          this.error.set(this.extractError(err));
          return of<BackendKpis | null>(null);
        }),
      ),
      trend: this.analytics.getTrend(params).pipe(
        catchError(err => {
          this.error.set(this.extractError(err));
          return of<TrendPointDto[]>([]);
        }),
      ),
      severity: this.analytics.getSeverityDistribution(params).pipe(
        catchError(err => {
          this.error.set(this.extractError(err));
          return of<{ severity: number; count: number }[]>([]);
        }),
      ),
      ranking: this.analytics.getStateRanking(params).pipe(
        catchError(err => {
          this.error.set(this.extractError(err));
          return of<StateRankingDto[]>([]);
        }),
      ),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(result => {
      this.loading.set(false);
      console.log('trend desde API:', result.trend);
      if (result.kpis) {
        this.kpis.set(this.mapKpis(result.kpis));
      }
      if (result.trend.length) {
        this.monthlyTrend.set(this.mapTrend(result.trend));
      }
      if (result.severity.length) {
        this.severityDistribution.set(this.mapSeverity(result.severity));
      }
      if (result.ranking.length) {
        this.stateRanking.set(result.ranking);
        this.heatmapCells.set(this.rankingToHeatmap(result.ranking));
      }
    });
  }

  private loadGeographic(params: ReturnType<typeof filtersToQueryParams>): void {
    this.analytics.getStateRanking(params).pipe(
      catchError(err => {
        this.error.set(this.extractError(err));
        return of([]);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(ranking => {
      this.loading.set(false);
      this.stateRanking.set(ranking);
      this.heatmapCells.set(this.rankingToHeatmap(ranking));
    });
  }

  private loadTemporal(params: ReturnType<typeof filtersToQueryParams>): void {
    forkJoin({
      trend: this.analytics.getTrend(params),
      hourly: this.analytics.getTimeOfDay(params),
    }).pipe(
      catchError(err => {
        this.error.set(this.extractError(err));
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(result => {
      this.loading.set(false);
      if (!result) return;
      this.monthlyTrend.set(this.mapTrend(result.trend));
      this.hourlyTrend.set(this.mapHourly(result.hourly));
    });
  }

  private loadFactors(params: ReturnType<typeof filtersToQueryParams>): void {
    forkJoin({
      severity: this.analytics.getSeverityDistribution(params),
      weather: this.analytics.getWeatherDistribution(params),
    }).pipe(
      catchError(err => {
        this.error.set(this.extractError(err));
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(result => {
      this.loading.set(false);
      if (!result) return;
      this.severityDistribution.set(this.mapSeverity(result.severity));
      this.weatherDistribution.set(
        result.weather.map(w => ({
          label: formatWeatherLabel(w.weather),
          value: w.count,
          color: weatherChartColor(formatWeatherLabel(w.weather)),
        })),
      );
    });
  }

  private mapKpis(data: BackendKpis): KPIData {
    return {
      totalAccidents: data.totalAccidents,
      totalFatalities: data.totalFatalities,
      avgPerDay: data.avgPerDay,
      topState: data.topState,
      topStateCount: data.topStateCount,
    };
  }

  private mapTrend(points: TrendPointDto[]): TrendPoint[] {
    return points.map(p => ({
      label: monthLabelFromIsoDate(p.date),
      accidents: p.count,
      fatalities: Math.round(p.count * 0.012),
    }));
  }

  private mapSeverity(
    points: { severity: number; count: number }[],
  ): FactorPoint[] {
    return points
      .sort((a, b) => a.severity - b.severity)
      .map(p => ({
        label: formatSeverityLabel(p.severity),
        value: p.count,
        color: severityColor(p.severity),
      }));
  }

  private mapHourly(points: HourlyPointDto[]): TrendPoint[] {
    const buckets = [
      { label: '00-06', from: 0, to: 6 },
      { label: '06-12', from: 6, to: 12 },
      { label: '12-18', from: 12, to: 18 },
      { label: '18-24', from: 18, to: 24 },
    ];

    return buckets.map(bucket => {
      const accidents = points
        .filter(p => p.hour >= bucket.from && p.hour < bucket.to)
        .reduce((sum, p) => sum + p.count, 0);
      return {
        label: bucket.label,
        accidents,
        fatalities: Math.round(accidents * 0.012),
      };
    });
  }

  private rankingToHeatmap(ranking: StateData[]): HeatmapCell[] {
    const max = Math.max(...ranking.map(r => r.accidents), 1);
    return ranking.map(item => {
      const intensity = item.accidents / max;
      let level: HeatmapCell['level'];
      let color: string;

      if (intensity >= 0.85) {
        level = 'Crítico';
        color = 'rgba(239, 68, 68, 0.88)';
      } else if (intensity >= 0.68) {
        level = 'Alto';
        color = 'rgba(249, 115, 22, 0.78)';
      } else if (intensity >= 0.42) {
        level = 'Moderado';
        color = 'rgba(14, 165, 233, 0.72)';
      } else {
        level = 'Bajo';
        color = 'rgba(59, 130, 246, 0.62)';
      }

      return {
        label: item.state,
        accidents: item.accidents,
        intensity,
        level,
        color,
        detail: `${level} · ${Math.round(intensity * 100)}% del pico`,
      };
    });
  }

  private titleCase(value: string): string {
    if (!value) return '';
    return value
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  private extractError(err: unknown): string {
    const e = err as { error?: { message?: string | string[] }; message?: string };
    const msg = e?.error?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
    return e?.message ?? 'Error al cargar datos del servidor';
  }
}