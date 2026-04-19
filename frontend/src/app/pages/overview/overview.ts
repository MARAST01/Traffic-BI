import { Component, inject, computed, OnInit } from '@angular/core';
import { NgFor, NgIf, DecimalPipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import {
  Chart, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Filler,
  Tooltip, Legend,
} from 'chart.js';

import { FiltersService } from '../../core/services/filters.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { FiltersBarComponent } from '../../shared/filters-bar/filters-bar';
import { KpiCardComponent } from '../../shared/kpi-card/kpi-card';

// Registrar módulos de Chart.js
Chart.register(
  CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Filler,
  Tooltip, Legend,
);

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    NgFor, NgIf, DecimalPipe,
    LucideAngularModule,
    BaseChartDirective,
    FiltersBarComponent,
    KpiCardComponent,
  ],
  templateUrl: './overview.html',
  styleUrl:    './overview.scss',
})
export class OverviewComponent implements OnInit {
  private filtersService = inject(FiltersService);
  private dataService    = inject(MockDataService);

  filters = this.filtersService.filters;

  // ── KPIs ──────────────────────────────────────────────────
  kpis = computed(() => this.dataService.getKPIs(this.filters()));

  // ── Gráfica de tendencia (línea + área) ───────────────────
  trendChartData = computed<ChartData<'line'>>(() => {
    const data = this.dataService.getMonthlyTrend(this.filters());
    return {
      labels: data.map(d => d.label),
      datasets: [
        {
          label:           'Accidentes',
          data:            data.map(d => d.accidents),
          borderColor:     '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
          borderWidth:     2.5,
          pointRadius:     3,
          pointHoverRadius: 6,
          pointBackgroundColor: '#3b82f6',
          tension:         0.4,
          fill:            true,
        },
        {
          label:           'Fatalidades',
          data:            data.map(d => d.fatalities),
          borderColor:     '#dc2626',
          backgroundColor: 'rgba(220, 38, 38, 0.06)',
          borderWidth:     2,
          pointRadius:     2,
          pointHoverRadius: 5,
          pointBackgroundColor: '#dc2626',
          tension:         0.4,
          fill:            true,
        },
      ],
    };
  });

  trendChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive:          true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        align:    'end',
        labels: {
          boxWidth:   10,
          boxHeight:  10,
          borderRadius: 3,
          useBorderRadius: true,
          font: { size: 12, family: 'DM Sans' },
          color: '#6b7280',
        },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor:  '#f1f5f9',
        bodyColor:   '#94a3b8',
        padding:     12,
        cornerRadius: 8,
        callbacks: {
          label: ctx =>
            ` ${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString('es-CO')}`,
        },
      },
    },
    scales: {
      x: {
        grid:  { display: false },
        ticks: { font: { size: 12, family: 'DM Sans' }, color: '#9ca3af' },
        border: { display: false },
      },
      y: {
        grid:  { color: '#f1f5f9' },
        ticks: {
          font: { size: 11, family: 'DM Sans' },
          color: '#9ca3af',
          callback: v => Number(v).toLocaleString('es-CO'),
        },
        border: { display: false, dash: [4, 4] },
      },
    },
  };

  // ── Gráfica de severidad (donut) ──────────────────────────
  severityChartData = computed<ChartData<'doughnut'>>(() => {
    const data = this.dataService.getSeverityDistribution(this.filters());
    return {
      labels:   data.map(d => d.label),
      datasets: [{
        data:             data.map(d => d.value),
        backgroundColor:  data.map(d => d.color),
        hoverBackgroundColor: data.map(d => d.color),
        borderWidth:      0,
        hoverOffset:      6,
      }],
    };
  });

  severityChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive:          true,
    maintainAspectRatio: false,
    cutout:              '72%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth:  10,
          boxHeight: 10,
          borderRadius: 3,
          useBorderRadius: true,
          font:  { size: 12, family: 'DM Sans' },
          color: '#374151',
          padding: 14,
        },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor:  '#f1f5f9',
        bodyColor:   '#94a3b8',
        padding:     12,
        cornerRadius: 8,
        callbacks: {
          label: ctx =>
            ` ${ctx.label}: ${ctx.parsed.toLocaleString('es-CO')}`,
        },
      },
    },
  };

  // ── Ranking de estados ────────────────────────────────────
  stateRanking = computed(() =>
    this.dataService.getStateRanking(this.filters()).slice(0, 6),
  );

  onDownloadReport() {
    console.log('Generando reporte con filtros:', this.filters());
    // Aquí se conectará al endpoint de reportes del backend
  }

  ngOnInit() {}
}