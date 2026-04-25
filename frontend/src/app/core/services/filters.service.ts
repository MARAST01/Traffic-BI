import { Injectable, signal, computed } from '@angular/core';

export interface AccidentFilters {
  year:     string;
  state:    string;
  severity: string;
  weather:  string;
}

const DEFAULT_FILTERS: AccidentFilters = {
  year:     'Todos',
  state:    'Todos',
  severity: 'Todos',
  weather:  'Todos',
};

export const YEARS     = ['Todos', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023'];
export const STATES    = ['Todos', 'California', 'Texas', 'Florida', 'New York', 'Pennsylvania',
                          'Ohio', 'Illinois', 'Georgia', 'North Carolina', 'Michigan',
                          'New Jersey', 'Virginia', 'Washington', 'Arizona', 'Tennessee',
                          'Indiana', 'Missouri', 'Maryland', 'Wisconsin', 'Colorado'];
export const SEVERITIES = ['Todos', 'Fatal', 'Grave', 'Moderado', 'Leve'];
export const WEATHERS   = ['Todos', 'Despejado', 'Lluvia', 'Nieve', 'Niebla', 'Viento'];

@Injectable({ providedIn: 'root' })
export class FiltersService {
  private _filters = signal<AccidentFilters>({ ...DEFAULT_FILTERS });

  // Lectura pública
  readonly filters = this._filters.asReadonly();

  // Cuántos filtros activos (excluyendo "Todos")
  readonly activeCount = computed(() =>
    Object.values(this._filters()).filter(v => v !== 'Todos').length,
  );

  readonly hasActiveFilters = computed(() => this.activeCount() > 0);

  update(key: keyof AccidentFilters, value: string) {
    this._filters.update(f => ({ ...f, [key]: value }));
  }

  reset() {
    this._filters.set({ ...DEFAULT_FILTERS });
  }
}