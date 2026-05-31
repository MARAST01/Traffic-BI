import { Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

import { FiltersService } from '../../core/services/filters.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { FiltersBarComponent } from '../../shared/filters-bar/filters-bar';

@Component({
  selector: 'app-dynamic-tables',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, FiltersBarComponent],
  templateUrl: './dynamic-tables.html',
  styleUrl: './dynamic-tables.scss',
})
export class DynamicTables implements OnInit, OnDestroy {
  private filtersService = inject(FiltersService);
  private dashboard = inject(DashboardService);

  filters = this.filtersService.filters;
  loading = this.dashboard.loading;
  error = this.dashboard.error;

  searchTerm = '';
  sortColumn = signal<'date' | 'area' | 'severity' | 'weather' | 'accidents'>('date');
  sortDirection = signal<'asc' | 'desc'>('desc');
  currentPage = signal(1);
  pageSize = 6;

  allRows = computed(() => this.dashboard.tableRows());

  filteredRows = computed(() => {
    const term = this.searchTerm.toLowerCase().trim();
    const rows = term
      ? this.allRows().filter(row =>
          [row.date, row.area, row.severity, row.weather].some(value =>
            value.toLowerCase().includes(term),
          ),
        )
      : this.allRows();

    const column = this.sortColumn();
    const direction = this.sortDirection();
    return [...rows].sort((a, b) => {
      const left = a[column];
      const right = b[column];
      const multiplier = direction === 'asc' ? 1 : -1;

      if (typeof left === 'number' && typeof right === 'number') {
        return (left - right) * multiplier;
      }

      return String(left).localeCompare(String(right)) * multiplier;
    });
  });

  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.dashboard.tableTotal() / this.pageSize)),
  );

  paginatedRows = computed(() => this.filteredRows());
  tableTotal = computed(() => this.dashboard.tableTotal());

  ngOnInit(): void {
    this.dashboard.connect('tables');
  }

  ngOnDestroy(): void {
    this.dashboard.disconnect();
  }

  sort(column: 'date' | 'area' | 'severity' | 'weather' | 'accidents') {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('desc');
    }
  }

  goToPage(page: number) {
    const next = Math.min(Math.max(page, 1), this.totalPages());
    this.currentPage.set(next);
    this.dashboard.loadTablePage(next, this.pageSize);
  }

  onApplyFilters() {
    this.currentPage.set(1);
    this.dashboard.reload();
  }

  onDownloadReport(format: 'pdf' | 'xlsx') {
    this.dashboard.exportReport(format);
  }
}