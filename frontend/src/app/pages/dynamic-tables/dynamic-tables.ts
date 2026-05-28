import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

import { FiltersService } from '../../core/services/filters.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { FiltersBarComponent } from '../../shared/filters-bar/filters-bar';

@Component({
  selector: 'app-dynamic-tables',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, FiltersBarComponent],
  templateUrl: './dynamic-tables.html',
  styleUrl: './dynamic-tables.scss',
})
export class DynamicTables {
  private filtersService = inject(FiltersService);
  private dataService = inject(MockDataService);

  filters = this.filtersService.filters;
  searchTerm = signal('');
  sortColumn = signal<'date' | 'area' | 'severity' | 'weather' | 'accidents'>('date');
  sortDirection = signal<'asc' | 'desc'>('desc');
  currentPage = signal(1);
  pageSize = 6;

  allRows = computed(() => this.dataService.getTableRows(this.filters()));

  filteredRows = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const rows = this.allRows().filter(row =>
      [row.date, row.area, row.severity, row.weather].some(value => value.toLowerCase().includes(term)),
    );

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

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredRows().length / this.pageSize)));

  paginatedRows = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredRows().slice(start, start + this.pageSize);
  });

  sort(column: 'date' | 'area' | 'severity' | 'weather' | 'accidents') {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('desc');
    }
    this.currentPage.set(1);
  }

  goToPage(page: number) {
    this.currentPage.set(Math.min(Math.max(page, 1), this.totalPages()));
  }

  onDownloadReport(format: 'pdf' | 'xlsx') {
    console.log('Table export', format, this.filters());
  }
}
