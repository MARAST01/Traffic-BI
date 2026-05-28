import { AccidentFilters } from '../services/filters.service';
import { AnalyticsQueryParams } from '../models/analytics-api.model';

const MONTH_INDEX: Record<string, number> = {
  Ene: 0, Feb: 1, Mar: 2, Abr: 3, May: 4, Jun: 5,
  Jul: 6, Ago: 7, Sep: 8, Oct: 9, Nov: 10, Dic: 11,
};

const SEVERITY_TO_API: Record<string, number> = {
  Leve: 1,
  Moderado: 2,
  Grave: 3,
  Fatal: 4,
};

const WEATHER_TO_API: Record<string, string> = {
  Despejado: 'clear',
  Lluvia: 'rain',
  Nieve: 'snow',
  Niebla: 'fog',
  Viento: 'wind',
};

const WEATHER_FROM_API: Record<string, string> = Object.fromEntries(
  Object.entries(WEATHER_TO_API).map(([es, en]) => [en, es]),
);

const SEVERITY_LABELS: Record<number, string> = {
  1: 'Leve',
  2: 'Moderado',
  3: 'Grave',
  4: 'Fatal',
};

const SEVERITY_COLORS: Record<number, string> = {
  1: '#3b82f6',
  2: '#f59e0b',
  3: '#f97316',
  4: '#dc2626',
};

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function filtersToQueryParams(filters: AccidentFilters): AnalyticsQueryParams {
  const params: AnalyticsQueryParams = {};

  if (filters.state !== 'Todos') {
    params.state = filters.state.toLowerCase();
  }

  if (filters.weather !== 'Todos') {
    params.weather = WEATHER_TO_API[filters.weather] ?? filters.weather.toLowerCase();
  }

  if (filters.severity !== 'Todos') {
    params.severity = SEVERITY_TO_API[filters.severity];
  }

  const { startDate, endDate } = resolveDateRange(filters);
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  return params;
}

function resolveDateRange(filters: AccidentFilters): { startDate?: string; endDate?: string } {
  if (filters.year === 'Todos' && filters.month === 'Todos') {
    return {};
  }

  const year = filters.year === 'Todos' ? new Date().getFullYear() : Number(filters.year);

  if (filters.month === 'Todos') {
    return {
      startDate: new Date(year, 0, 1).toISOString(),
      endDate: new Date(year, 11, 31, 23, 59, 59).toISOString(),
    };
  }

  const month = MONTH_INDEX[filters.month] ?? 0;
  const lastDay = new Date(year, month + 1, 0).getDate();

  return {
    startDate: new Date(year, month, 1).toISOString(),
    endDate: new Date(year, month, lastDay, 23, 59, 59).toISOString(),
  };
}

export function formatWeatherLabel(weather: string): string {
  const key = weather?.toLowerCase() ?? '';
  return WEATHER_FROM_API[key] ?? weather;
}

export function formatSeverityLabel(severity: number): string {
  return SEVERITY_LABELS[severity] ?? `Nivel ${severity}`;
}

export function severityColor(severity: number): string {
  return SEVERITY_COLORS[severity] ?? '#64748b';
}

export function monthLabelFromIsoDate(isoMonth: string): string {
  const [, month] = isoMonth.split('-');
  const idx = Number(month) - 1;
  return MONTH_LABELS[idx] ?? isoMonth;
}

export function weatherChartColor(label: string): string {
  const map: Record<string, string> = {
    Despejado: '#22c55e',
    Lluvia: '#0ea5e9',
    Niebla: '#a78bfa',
    Nieve: '#f59e0b',
    Viento: '#fb7185',
  };
  return map[label] ?? '#94a3b8';
}

export { WEATHER_TO_API, SEVERITY_TO_API, MONTH_LABELS };
