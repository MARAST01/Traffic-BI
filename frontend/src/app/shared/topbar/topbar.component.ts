import { Component, computed, inject, input, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { filter, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';

interface Breadcrumb {
  label: string;
  icon:  string;
}

const ROUTE_META: Record<string, Breadcrumb> = {
  '/':           { label: 'Dashboard',           icon: 'LayoutDashboard' },
  '/geographic': { label: 'Análisis Geográfico',  icon: 'Map'             },
  '/temporal':   { label: 'Análisis Temporal',    icon: 'CalendarDays'    },
  '/factors':    { label: 'Factores Asociados',   icon: 'GitBranch'       },
  '/prediction': { label: 'Predicción de Riesgo', icon: 'BrainCircuit'    },
  '/tables':     { label: 'Tablas Dinámicas',     icon: 'Table2'          },
  '/users':      { label: 'Gestión de Usuarios',  icon: 'Users'           },
  '/logs':       { label: 'Auditoría',            icon: 'ScrollText'      },
};

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [NgClass, LucideAngularModule],
  templateUrl: './topbar.component.html',
  styleUrl:    './topbar.component.scss',
})
export class TopbarComponent {
  sidebarCollapsed = input<boolean>(false);
  toggleSidebar    = output<void>();

  private auth   = inject(AuthService);
  private router = inject(Router);

  user = this.auth.user;

  // Señal reactiva con la ruta activa
  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  currentPage = computed<Breadcrumb>(() => {
    const url  = this.currentUrl() ?? '/';
    const path = url.split('?')[0];
    return ROUTE_META[path] ?? { label: 'Dashboard', icon: 'LayoutDashboard' };
  });

  today = computed(() => {
    return new Date().toLocaleDateString('es-CO', {
      weekday: 'long',
      year:    'numeric',
      month:   'long',
      day:     'numeric',
    });
  });

  onToggle() {
    this.toggleSidebar.emit();
  }
}