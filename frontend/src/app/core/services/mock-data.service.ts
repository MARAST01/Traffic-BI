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

@Injectable({ providedIn: 'root' })
export class MockDataService {

  private multiplier(f: AccidentFilters): number {
    let m = 1;
    if (f.year     !== 'Todos') m *= 0.125;
    if (f.state    !== 'Todos') m *= 0.05;
    if (f.severity !== 'Todos') m *= 0.25;
    if (f.weather  !== 'Todos') m *= 0.20;
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
    const months = ['Ene','Feb','Mar','Abr','May','Jun',
                    'Jul','Ago','Sep','Oct','Nov','Dic'];
    const bases  = [68,62,71,74,82,85,91,89,79,75,70,67];
    return months.map((label, i) => ({
      label,
      accidents:  Math.round(bases[i]! * 1000 * m),
      fatalities: Math.round(bases[i]! * 12 * m),
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

  getSeverityDistribution(f: AccidentFilters): { label: string; value: number; color: string }[] {
    const m = this.multiplier(f);
    return [
      { label: 'Leve',     value: Math.round(3_256_056 * m), color: '#3b82f6' },
      { label: 'Moderado', value: Math.round(2_534_988 * m), color: '#f59e0b' },
      { label: 'Grave',    value: Math.round(1_085_852 * m), color: '#f97316' },
      { label: 'Fatal',    value: Math.round(  368_784 * m), color: '#dc2626' },
    ];
  }
}