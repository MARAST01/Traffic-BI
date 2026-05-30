import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { AuditLogService } from '../../core/services/audit-log.service';
import { AuditLog } from '../../core/models/audit-log.model';

const PAGE_LABELS: Record<string, string> = {
  overview:   'Resumen',
  geographic: 'Geográfico',
  temporal:   'Temporal',
  factors:    'Factores',
  tables:     'Tablas',
};

const ROLE_COLORS: Record<string, string> = {
  Administrador: 'role--admin',
  Analista:      'role--analyst',
  Gerente:       'role--manager',
};

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, LucideAngularModule],
  templateUrl: './audit-logs.html',
  styleUrl: './audit-logs.scss',
})
export class AuditLogs implements OnInit {
  private readonly auditLogService = inject(AuditLogService);
  // DestroyRef del COMPONENTE — se recrea cada vez que el componente se monta
  private readonly destroyRef = inject(DestroyRef);

  logs    = signal<AuditLog[]>([]);
  total   = signal(0);
  loading = signal(false);
  error   = signal<string | null>(null);

  currentPage = signal(1);
  readonly limit = 20;

  totalPages = computed(() => Math.ceil(this.total() / this.limit));
  pages      = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.auditLogService.getAll(this.currentPage(), this.limit)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.logs.set(res.data);
          this.total.set(res.total);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudieron cargar los registros de auditoría.');
          this.loading.set(false);
        },
      });
  }

  goTo(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.load();
  }

  formatFilters(log: AuditLog): { label: string; value: string }[] {
    const f = log.filters;
    return [
      { label: 'Año',       value: f.year      ?? 'Todos' },
      { label: 'Mes',       value: f.month     ?? 'Todos' },
      { label: 'Estado',    value: f.state     ?? 'Todos' },
      { label: 'Severidad', value: f.severity  ?? 'Todos' },
      { label: 'Clima',     value: f.weather   ?? 'Todos' },
    ].filter(item => item.value !== 'Todos');
  }

  hasActiveFilters(log: AuditLog): boolean {
    return this.formatFilters(log).length > 0;
  }

  pageLabel(page: string): string {
    return PAGE_LABELS[page] ?? page;
  }

  roleClass(role: string): string {
    return ROLE_COLORS[role] ?? 'role--default';
  }
}