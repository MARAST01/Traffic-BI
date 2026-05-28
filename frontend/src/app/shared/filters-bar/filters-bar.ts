import { Component, inject, output } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import {
  FiltersService,
  AccidentFilters,
  MONTHS,
  SEVERITIES,
} from '../../core/services/filters.service';

@Component({
  selector: 'app-filters-bar',
  standalone: true,
  imports: [NgFor, NgIf, LucideAngularModule],
  templateUrl: './filters-bar.html',
  styleUrl: './filters-bar.scss',
})
export class FiltersBarComponent {
  downloadReport = output<'pdf' | 'xlsx'>();

  private filtersService = inject(FiltersService);

  filters = this.filtersService.filters;
  activeCount = this.filtersService.activeCount;
  hasActive = this.filtersService.hasActiveFilters;

  years = this.filtersService.years;
  months = MONTHS;
  states = this.filtersService.states;
  severities = SEVERITIES;
  weathers = this.filtersService.weathers;

  update(key: keyof AccidentFilters, event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.filtersService.update(key, val);
  }

  reset() {
    this.filtersService.reset();
  }

  onDownload(format: 'pdf' | 'xlsx') {
    this.downloadReport.emit(format);
  }
}
