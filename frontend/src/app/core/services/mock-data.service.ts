import { Injectable } from '@angular/core';
import { AccidentFilters } from './filters.service';

export interface KPIData {
  totalAccidents: number;
  totalFatalities: number;
  avgPerDay:       number;
  topState:        string;
  topStateCount:   number;
}

export interface TrendPoint {
  label:     string;
  accidents: number;
  fatalities: number;
}

export interface StateData {
  state:     string;
  accidents: number;
  pct:       number;
}

export interface HeatmapCell {
  label:        string;
  accidents:    number;
  intensity:    number;
  level:        'Bajo' | 'Moderado' | 'Alto' | 'Crítico';
  color:        string;
  detail:       string;
}

export interface IncidentRow {
  date:         string;
  area:         string;
  severity:     string;
  weather:      string;
  accidents:    number;
  fatalities:   number;
  riskScore:    number;
}

export interface FactorPoint {
  label:        string;
  value:        number;
  color:        string;
}

@Injectable({ providedIn: 'root' })
export class MockDataService {

  private multiplier(f: AccidentFilters): number {
    let m = 1;
    if (f.year     !== 'Todos') m *= 0.85;
    if (f.month    !== 'Todos') m *= 0.72;
    if (f.state    !== 'Todos') m *= 0.83;
    if (f.severity !== 'Todos') m *= 0.88;
    if (f.weather  !== 'Todos') m *= 0.9;
    return Math.max(m, 0.001);
  }

  getKPIs(f: AccidentFilters): KPIData {
    const m = this.multiplier(f);
    const total = Math.round(7_245_680 * m);
    return {
      totalAccidents:  total,
      totalFatalities: Math.round(total * 0.0118),
      avgPerDay:       Math.round(total / (365 * (f.year === 'Todos' ? 8 : 1))),
      topState:        f.state !== 'Todos' ? f.state : 'California',
      topStateCount:   Math.round(total * (f.state !== 'Todos' ? 1 : 0.172)),
    };
  }

  getTrendData(f: AccidentFilters): TrendPoint[] {
    const m   = this.multiplier(f);
    const base = [
      820_000, 845_000, 890_000, 912_000, 875_000,
      798_000, 810_000, 856_000,
    ];
    const years = f.year === 'Todos'
      ? ['2016','2017','2018','2019','2020','2021','2022','2023']
      : [f.year];

    return years.map((yr, i) => {
      const acc = Math.round((base[i] ?? base[0]) * m * (f.year !== 'Todos' ? 8 : 1));
      return {
        label:      yr,
        accidents:  acc,
        fatalities: Math.round(acc * 0.0118),
      };
    });
  }

  getMonthlyTrend(f: AccidentFilters): TrendPoint[] {
    const m = this.multiplier(f);
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const bases  = [68,62,71,74,82,85,91,89,79,75,70,67];
    return months.map((label, i) => ({
      label,
      accidents:  Math.round(bases[i]! * 1000 * m * (f.month === label ? 1.22 : 0.96)),
      fatalities: Math.round(bases[i]! * 12 * m * (f.month === label ? 1.16 : 0.96)),
    }));
  }

  getHourlyTrend(f: AccidentFilters): TrendPoint[] {
    const m = this.multiplier(f);
    const hours = ['00-06', '06-12', '12-18', '18-24'];
    const bases = [52, 71, 83, 68];
    return hours.map((label, i) => ({
      label,
      accidents: Math.round(bases[i]! * 1200 * m),
      fatalities: Math.round(bases[i]! * 18 * m),
    }));
  }

  getStateRanking(f: AccidentFilters): StateData[] {
    const m = this.multiplier(f);
    const raw = [
      { state: 'California',     accidents: 1_245_680 },
      { state: 'Texas',          accidents: 982_450   },
      { state: 'Florida',        accidents: 756_320   },
      { state: 'New York',       accidents: 421_890   },
      { state: 'Pennsylvania',   accidents: 389_540   },
      { state: 'Ohio',           accidents: 312_780   },
      { state: 'Illinois',       accidents: 298_450   },
      { state: 'Georgia',        accidents: 276_310   },
      { state: 'North Carolina', accidents: 251_670   },
      { state: 'Michigan',       accidents: 234_890   },
    ];
    const data = f.state !== 'Todos'
      ? raw.filter(r => r.state === f.state)
      : raw;
    const max = data[0]?.accidents ?? 1;
    return data.map(d => ({
      state:     d.state,
      accidents: Math.round(d.accidents * m),
      pct:       Math.round((d.accidents / max) * 100),
    }));
  }

  getHeatmapCells(f: AccidentFilters): HeatmapCell[] {
    const ranking = this.getStateRanking(f);
    const max = Math.max(...ranking.map(d => d.accidents), 1);

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
        detail: `${level} · ${Math.round(intensity * 100)}% del pico` ,
      };
    });
  }

  getSeverityDistribution(f: AccidentFilters): { label: string; value: number; color: string }[] {
    const m = this.multiplier(f);
    return [
      { label: 'Leve',     value: Math.round(3_256_056 * m), color: '#3b82f6' },
      { label: 'Moderado', value: Math.round(2_534_988 * m), color: '#f59e0b' },
      { label: 'Grave',    value: Math.round(1_085_852 * m), color: '#f97316' },
      { label: 'Fatal',    value: Math.round(  368_784 * m), color: '#dc2626' },
    ];
  }

  getWeatherDistribution(f: AccidentFilters): FactorPoint[] {
    const m = this.multiplier(f);
    return [
      { label: 'Despejado', value: Math.round(2_513_500 * m), color: '#22c55e' },
      { label: 'Lluvia',     value: Math.round(1_625_200 * m), color: '#0ea5e9' },
      { label: 'Niebla',     value: Math.round(1_142_700 * m), color: '#a78bfa' },
      { label: 'Nieve',      value: Math.round(  610_200 * m), color: '#f59e0b' },
      { label: 'Viento',     value: Math.round(  353_800 * m), color: '#fb7185' },
    ];
  }

  getTableRows(f: AccidentFilters): IncidentRow[] {
    const m = this.multiplier(f);
    const regions = ['California', 'Texas', 'Florida', 'New York', 'Illinois'];
    const severities = ['Leve', 'Moderado', 'Grave', 'Fatal'];
    const weather = ['Despejado', 'Lluvia', 'Niebla', 'Nieve'];

    return Array.from({ length: 12 }, (_, index) => {
      const region = regions[index % regions.length]!;
      const severity = severities[index % severities.length]!;
      const climate = weather[index % weather.length]!;
      const accidents = Math.round((420 + index * 36) * m);

      return {
        date: `202${((index % 4) + 3).toString()}-${String((index % 12) + 1).padStart(2, '0')}-${String((index % 27) + 1).padStart(2, '0')}`,
        area: `${region} · ${['Sur','Centro','Norte'][index % 3]}`,
        severity,
        weather: climate,
        accidents,
        fatalities: Math.round(accidents * (severity === 'Fatal' ? 0.15 : severity === 'Grave' ? 0.08 : severity === 'Moderado' ? 0.04 : 0.02)),
        riskScore: Math.round((accidents / 300) * (severity === 'Fatal' ? 1.6 : severity === 'Grave' ? 1.3 : severity === 'Moderado' ? 1.1 : 0.9)),
      };
    });
  }
}