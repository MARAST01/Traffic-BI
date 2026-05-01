import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/layout/layout').then((m) => m.LayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/overview/overview').then((m) => m.OverviewComponent),
      },
      {
        path: 'geographic',
        loadComponent: () =>
          import('./pages/geographic-analysis/geographic-analysis').then(
            (m) => m.GeographicAnalysis,
          ),
      },
      {
        path: 'temporal',
        loadComponent: () =>
          import('./pages/temporal-analysis/temporal-analysis').then((m) => m.TemporalAnalysis),
      },
      {
        path: 'factors',
        loadComponent: () =>
          import('./pages/associated-factors/associated-factors').then((m) => m.AssociatedFactors),
      },
      {
        path: 'prediction',
        canActivate: [roleGuard],
        data: { roles: ['Gerente'] },
        loadComponent: () =>
          import('./pages/risk-prediction/risk-prediction').then((m) => m.RiskPrediction),
      },
      {
        path: 'tables',
        canActivate: [roleGuard],
        data: { roles: ['Analista'] },
        loadComponent: () =>
          import('./pages/dynamic-tables/dynamic-tables').then((m) => m.DynamicTables),
      },
      {
        path: 'users',
        canActivate: [roleGuard],
        data: { roles: ['Administrador'] },
        loadComponent: () =>
          import('./pages/user-management/user-management').then((m) => m.UserManagement),
      },
      {
        path: 'logs',
        canActivate: [roleGuard],
        data: { roles: ['Administrador'] },
        loadComponent: () => import('./pages/audit-logs/audit-logs').then((m) => m.AuditLogs),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
