import { Component, computed, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { LucideAngularModule, icons } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models/user.model';

interface NavItem {
  path:    string;
  label:   string;
  icon:    keyof typeof icons;
  roles:   UserRole[];
  badge?:  string;
}

const NAV_ITEMS: NavItem[] = [
  {
    path:  '/',
    label: 'Dashboard',
    icon:  'LayoutDashboard',
    roles: ['Gerente', 'Analista', 'Administrador'],
  },
  {
    path:  '/geographic',
    label: 'Análisis Geográfico',
    icon:  'Map',
    roles: ['Gerente', 'Analista'],
  },
  {
    path:  '/temporal',
    label: 'Análisis Temporal',
    icon:  'CalendarDays',
    roles: ['Gerente', 'Analista'],
  },
  {
    path:  '/factors',
    label: 'Factores Asociados',
    icon:  'GitBranch',
    roles: ['Gerente', 'Analista'],
  },
  {
    path:  '/prediction',
    label: 'Predicción de Riesgo',
    icon:  'BrainCircuit',
    roles: ['Gerente'],
    badge: 'IA',
  },
  {
    path:  '/tables',
    label: 'Tablas Dinámicas',
    icon:  'Table2',
    roles: ['Analista'],
  },
  {
    path:  '/users',
    label: 'Gestión de Usuarios',
    icon:  'Users',
    roles: ['Administrador'],
  },
  {
    path:  '/logs',
    label: 'Auditoría',
    icon:  'ScrollText',
    roles: ['Administrador'],
  },
];

const ROLE_COLORS: Record<UserRole, string> = {
  Gerente:       'role-badge--gerente',
  Analista:      'role-badge--analista',
  Administrador: 'role-badge--admin',
};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgClass, NgFor, NgIf, LucideAngularModule],
  templateUrl: './sidebar.component.html',
  styleUrl:    './sidebar.component.scss',
})
export class SidebarComponent {
  collapsed = input<boolean>(false);

  private auth = inject(AuthService);

  user     = this.auth.user;
  userRole = this.auth.userRole;

  visibleItems = computed(() => {
    const role = this.userRole();
    if (!role) return [];
    return NAV_ITEMS.filter(item => item.roles.includes(role));
  });

  roleClass = computed(() => {
    const role = this.userRole();
    return role ? ROLE_COLORS[role] : '';
  });

  userInitials = computed(() => {
    const name = this.user()?.name ?? '';
    return name
      .split(' ')
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase();
  });

  logout() {
    this.auth.logout();
  }
}