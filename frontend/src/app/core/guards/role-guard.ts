import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  const allowedRoles: string[] = route.data['roles'] ?? [];

  if (!auth.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  if (allowedRoles.length === 0) return true;

  const userRole = auth.userRole();
  if (userRole && allowedRoles.includes(userRole)) return true;

  // Sin permiso → redirigir al dashboard
  router.navigate(['/']);
  return false;
};