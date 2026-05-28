import { Injectable, signal, computed, inject } from '@angular/core';
import { AnalyticsService } from './analytics.service';
import { formatWeatherLabel } from '../utils/filter-mapper';

export interface AccidentFilters {
  year:     string;
  month:    string;
  state:    string;
  severity: string;
  weather:  string;
}

const DEFAULT_FILTERS: AccidentFilters = {
  year:     'Todos',
  month:    'Todos',
  state:    'Todos',
  severity: 'Todos',
  weather:  'Todos',
};

export const YEARS     = ['Todos', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023'];
export const MONTHS    = ['Todos', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
export const SEVERITIES = ['Todos', 'Fatal', 'Grave', 'Moderado', 'Leve'];
export const WEATHERS   = ['Todos', 'Despejado', 'Lluvia', 'Nieve', 'Niebla', 'Viento'];
/** @deprecated Usar FiltersService.states() */
export const STATES = ['Todos'];

@Injectable({ providedIn: 'root' })
export class FiltersService {
  private readonly analytics = inject(AnalyticsService);

  private _filters = signal<AccidentFilters>({ ...DEFAULT_FILTERS });
  private _states = signal<string[]>(['Todos']);
  private _weathers = signal<string[]>(WEATHERS);
  private _years = signal<string[]>(YEARS);
  private _optionsLoaded = signal(false);

  readonly filters = this._filters.asReadonly();
  readonly states = this._states.asReadonly();
  readonly weathers = this._weathers.asReadonly();
  readonly years = this._years.asReadonly();
  readonly optionsLoaded = this._optionsLoaded.asReadonly();

  readonly activeCount = computed(() =>
    Object.values(this._filters()).filter(v => v !== 'Todos').length,
  );

  readonly hasActiveFilters = computed(() => this.activeCount() > 0);

  loadFilterOptions(): void {
    this.analytics.getFilterLocations().subscribe({
      next: locations => {
        const unique = [...new Set(
          locations
            .map(l => l.state)
            .filter(Boolean)
            .map(s => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')),
        )].sort();
        if (unique.length) {
          this._states.set(['Todos', ...unique]);
        }
        this._optionsLoaded.set(true);
      },
      error: () => this._optionsLoaded.set(true),
    });

    this.analytics.getFilterWeather().subscribe({
      next: types => {
        const labels = types.map(t => formatWeatherLabel(t));
        const unique = [...new Set(labels)].sort();
        if (unique.length) {
          this._weathers.set(['Todos', ...unique]);
        }
      },
    });

    this.analytics.getFilterDateRange().subscribe({
      next: range => {
        if (!range?.min || !range?.max) return;
        const minYear = new Date(range.min).getFullYear();
        const maxYear = new Date(range.max).getFullYear();
        const years: string[] = ['Todos'];
        for (let y = minYear; y <= maxYear; y++) {
          years.push(String(y));
        }
        this._years.set(years);
      },
    });
  }

  update(key: keyof AccidentFilters, value: string) {
    this._filters.update(f => ({ ...f, [key]: value }));
  }

  reset() {
    this._filters.set({ ...DEFAULT_FILTERS });
  }
}
