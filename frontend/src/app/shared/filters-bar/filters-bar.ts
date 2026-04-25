import { Component, inject, output } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import {
  FiltersService,
  AccidentFilters,
  YEARS,
  STATES,
  SEVERITIES,
  WEATHERS,
} from '../../core/services/filters.service';

@Component({
  selector: 'app-filters-bar',
  standalone: true,
  imports: [NgFor, NgIf, LucideAngularModule],
  templateUrl: './filters-bar.html',
  styleUrl: './filters-bar.scss',
})
export class FiltersBarComponent {
  downloadReport = output<void>();

  private filtersService = inject(FiltersService);

  filters = this.filtersService.filters;
  activeCount = this.filtersService.activeCount;
  hasActive = this.filtersService.hasActiveFilters;

  years = YEARS;
  states = STATES;
  severities = SEVERITIES;
  weathers = WEATHERS;

  update(key: keyof AccidentFilters, event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.filtersService.update(key, val);
  }

  reset() {
    this.filtersService.reset();
  }

  onDownload() {
    this.downloadReport.emit();
  }
}
