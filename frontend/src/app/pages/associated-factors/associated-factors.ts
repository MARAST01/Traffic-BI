import { Component, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, CategoryScale, LinearScale, ArcElement, DoughnutController, Tooltip, Legend, BarElement, BarController } from 'chart.js';
import { ChartConfiguration, ChartData } from 'chart.js';

import { FiltersService } from '../../core/services/filters.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { FiltersBarComponent } from '../../shared/filters-bar/filters-bar';

Chart.register(CategoryScale, LinearScale, ArcElement, DoughnutController, BarElement, BarController, Tooltip, Legend);

@Component({
  selector: 'app-associated-factors',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, BaseChartDirective, FiltersBarComponent],
  templateUrl: './associated-factors.html',
  styleUrl: './associated-factors.scss',
})
export class AssociatedFactors implements OnInit, OnDestroy {
  private filtersService = inject(FiltersService);
  private dashboard = inject(DashboardService);

  filters = this.filtersService.filters;
  loading = this.dashboard.loading;
  error = this.dashboard.error;

  severityDistribution = this.dashboard.severityDistribution;
  weatherDistribution = this.dashboard.weatherDistribution;

  severityChartData = computed<ChartData<'doughnut'>>(() => ({
    labels: this.severityDistribution().map(item => item.label),
    datasets: [{
      data: this.severityDistribution().map(item => item.value),
      backgroundColor: this.severityDistribution().map(item => item.color),
      borderWidth: 0,
    }],
  }));

  weatherChartData = computed<ChartData<'bar'>>(() => ({
    labels: this.weatherDistribution().map(item => item.label),
    datasets: [{
      label: 'Incidentes por clima',
      data: this.weatherDistribution().map(item => item.value),
      backgroundColor: this.weatherDistribution().map(item => item.color),
      borderRadius: 8,
    }],
  }));

  severityOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { position: 'right', labels: { color: '#64748b', font: { size: 11 } } },
      tooltip: { backgroundColor: '#1e293b', bodyColor: '#d0f2ff', titleColor: '#fff' },
    },
  };

  weatherOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#1e293b', bodyColor: '#d0f2ff', titleColor: '#fff' },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#9ca3af' } },
      y: { grid: { color: '#e2e8f0' }, ticks: { color: '#9ca3af', callback: value => Number(value).toLocaleString('es-CO') } },
    },
  };

  topFactors = computed(() => this.weatherDistribution().slice(0, 5));

  factorRows = computed(() => {
    const factors = this.topFactors();
    const maxValue = factors[0]?.value ?? 1;
    return factors.map(item => ({
      ...item,
      percent: Math.max((item.value / maxValue) * 100, 0),
    }));
  });

  ngOnInit(): void {
    this.dashboard.connect('factors');
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