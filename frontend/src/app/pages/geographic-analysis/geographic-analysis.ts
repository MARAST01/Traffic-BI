import { Component, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  Tooltip,
  Legend,
} from 'chart.js';

import { FiltersBarComponent } from '../../shared/filters-bar/filters-bar';
import { FiltersService } from '../../core/services/filters.service';
import { DashboardService } from '../../core/services/dashboard.service';

Chart.register(CategoryScale, LinearScale, BarElement, BarController, Tooltip, Legend);

@Component({
  selector: 'app-geographic-analysis',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, BaseChartDirective, FiltersBarComponent],
  templateUrl: './geographic-analysis.html',
  styleUrl: './geographic-analysis.scss',
})
export class GeographicAnalysis implements OnInit, OnDestroy {
  private filtersService = inject(FiltersService);
  private dashboard = inject(DashboardService);

  filters = this.filtersService.filters;
  loading = this.dashboard.loading;
  error = this.dashboard.error;
  heatmapCells = this.dashboard.heatmapCells;
  hotspots = computed(() => this.dashboard.stateRanking().slice(0, 6));

  hotspotChartData = computed<ChartData<'bar'>>(() => {
    const data = this.hotspots();
    return {
      labels: data.map(item => item.state),
      datasets: [
        {
          label: 'Accidentes',
          data: data.map(item => item.accidents),
          backgroundColor: ['#ef4444', '#f97316', '#fb7185', '#0ea5e9', '#22c55e', '#f59e0b'],
          borderRadius: 10,
        },
      ],
    };
  });

  hotspotChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 12,
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#6b7280', font: { size: 11 } },
      },
      y: {
        grid: { color: '#e2e8f0' },
        ticks: { color: '#6b7280', callback: value => Number(value).toLocaleString('es-CO') },
      },
    },
  };

  ngOnInit(): void {
    this.dashboard.connect('geographic');
  }

  ngOnDestroy(): void {
    this.dashboard.disconnect();
  }

  onApplyFilters() {
    this.dashboard.reload();
  }

  onDownloadReport(format: 'pdf' | 'xlsx') {
    this.dashboard.exportReport(format);
  }
}