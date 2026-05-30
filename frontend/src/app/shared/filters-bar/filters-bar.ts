import { Component, inject, output, signal } from '@angular/core';
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
  applyFilters   = output<void>();

  private filtersService = inject(FiltersService);

  activeCount = this.filtersService.activeCount;
  hasActive   = this.filtersService.hasActiveFilters;

  // Borrador local — no toca el servicio hasta presionar Aplicar
  draft = signal<AccidentFilters>({ ...this.filtersService.filters() });

  years      = this.filtersService.years;
  months     = MONTHS;
  states     = this.filtersService.states;
  severities = SEVERITIES;
  weathers   = this.filtersService.weathers;

  updateDraft(key: keyof AccidentFilters, event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.draft.update(prev => ({ ...prev, [key]: val }));
  }

  apply() {
    const d = this.draft();
    (Object.keys(d) as (keyof AccidentFilters)[]).forEach(k => {
      this.filtersService.update(k, d[k] as string);
    });
    this.applyFilters.emit();
  }

  reset() {
    this.filtersService.reset();
    this.draft.set({ ...this.filtersService.filters() });
    // También recarga al limpiar
    this.applyFilters.emit();
  }

  onDownload(format: 'pdf' | 'xlsx') {
    this.downloadReport.emit(format);
  }
}