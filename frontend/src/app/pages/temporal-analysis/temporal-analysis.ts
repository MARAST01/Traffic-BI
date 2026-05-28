import { Component, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend } from 'chart.js';

import { FiltersService } from '../../core/services/filters.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { FiltersBarComponent } from '../../shared/filters-bar/filters-bar';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

@Component({
  selector: 'app-temporal-analysis',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, BaseChartDirective, FiltersBarComponent],
  templateUrl: './temporal-analysis.html',
  styleUrl: './temporal-analysis.scss',
})
export class TemporalAnalysis implements OnInit, OnDestroy {
  private filtersService = inject(FiltersService);
  private dashboard = inject(DashboardService);

  filters = this.filtersService.filters;
  loading = this.dashboard.loading;
  error = this.dashboard.error;

  monthlyTrend = this.dashboard.monthlyTrend;
  hourlyTrend = this.dashboard.hourlyTrend;

  trendChartData = computed<ChartData<'line'>>(() => {
    const data = this.monthlyTrend();
    return {
      labels: data.map(point => point.label),
      datasets: [
        {
          label: 'Accidentes',
          data: data.map(point => point.accidents),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.12)',
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#2563eb',
        },
        {
          label: 'Graves (est.)',
          data: data.map(point => point.fatalities),
          borderColor: '#f97316',
          backgroundColor: 'rgba(249, 115, 22, 0.16)',
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#f97316',
        },
      ],
    };
  });

  hourlyChartData = computed<ChartData<'bar'>>(() => {
    const data = this.hourlyTrend();
    return {
      labels: data.map(point => point.label),
      datasets: [
        {
          label: 'Accidentes por turno',
          data: data.map(point => point.accidents),
          backgroundColor: ['#0ea5e9', '#22c55e', '#fb7185', '#f59e0b'],
          borderRadius: 8,
        },
      ],
    };
  });

  trendChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#64748b', font: { size: 11 } } },
      tooltip: {
        backgroundColor: '#1e293b',
        bodyColor: '#d0f2ff',
        titleColor: '#fff',
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#9ca3af' } },
      y: { grid: { color: '#e2e8f0' }, ticks: { color: '#9ca3af', callback: value => Number(value).toLocaleString('es-CO') } },
    },
  };

  hourlyChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        bodyColor: '#d0f2ff',
        titleColor: '#fff',
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#9ca3af' } },
      y: { grid: { color: '#e2e8f0' }, ticks: { color: '#9ca3af', callback: value => Number(value).toLocaleString('es-CO') } },
    },
  };

  peakMonth = computed(() => {
    const data = this.monthlyTrend();
    if (!data.length) return { label: '—', accidents: 0 };
    return data.reduce((max, point) => point.accidents > max.accidents ? point : max, data[0]);
  });

  ngOnInit(): void {
    this.dashboard.connect('temporal');
  }

  ngOnDestroy(): void {
    this.dashboard.disconnect();
  }

  onDownloadReport(format: 'pdf' | 'xlsx') {
    this.dashboard.exportReport(format);
  }
}
