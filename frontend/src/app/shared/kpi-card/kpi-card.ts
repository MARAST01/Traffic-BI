import { Component, input, computed } from '@angular/core';
import { LucideAngularModule, icons } from 'lucide-angular';
import { NgClass } from '@angular/common';

export type KpiColor = 'red' | 'orange' | 'blue' | 'green';

interface ColorConfig {
  bg:     string;
  text:   string;
  icon:   string;
  border: string;
  trend:  string;
}

const COLOR_MAP: Record<KpiColor, ColorConfig> = {
  red:    { bg: '#fef2f2', text: '#dc2626', icon: '#fecaca', border: '#fecaca', trend: '#ef4444' },
  orange: { bg: '#fff7ed', text: '#ea580c', icon: '#fed7aa', border: '#fed7aa', trend: '#f97316' },
  blue:   { bg: '#eff6ff', text: '#2563eb', icon: '#bfdbfe', border: '#bfdbfe', trend: '#3b82f6' },
  green:  { bg: '#f0fdf4', text: '#16a34a', icon: '#bbf7d0', border: '#bbf7d0', trend: '#22c55e' },
};

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [LucideAngularModule, NgClass],
  templateUrl: './kpi-card.html',
  styleUrl:    './kpi-card.scss',
})
export class KpiCardComponent {
  title    = input.required<string>();
  value    = input.required<string | number>();
  subtitle = input<string>('');
  icon     = input.required<keyof typeof icons>();
  color    = input<KpiColor>('blue');
  trend    = input<number | null>(null);  // % cambio respecto período anterior

  colors = computed(() => COLOR_MAP[this.color()]);

  formattedValue = computed(() => {
    const v = this.value();
    if (typeof v === 'number') {
      return v.toLocaleString('es-CO');
    }
    return v;
  });

  trendLabel = computed(() => {
    const t = this.trend();
    if (t === null) return null;
    return t >= 0 ? `+${t}%` : `${t}%`;
  });

  trendUp = computed(() => (this.trend() ?? 0) >= 0);
}