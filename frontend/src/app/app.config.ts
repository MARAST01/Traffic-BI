import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  LucideAngularModule,
  LayoutDashboard, Map, CalendarDays, GitBranch,
  BrainCircuit, Table2, Users, ScrollText,
  Activity, LogOut, User, PanelLeftOpen, PanelLeftClose,
  Mail, Lock, Eye, EyeOff, LogIn, AlertCircle,
  SlidersHorizontal, X, Download,
  AlertTriangle, HeartPulse, CalendarClock, MapPin,
  TrendingUp, TrendingDown,

} from 'lucide-angular';
import { importProvidersFrom } from '@angular/core';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    importProvidersFrom(
      LucideAngularModule.pick({
        LayoutDashboard, Map, CalendarDays, GitBranch,
        BrainCircuit, Table2, Users, ScrollText,
        Activity, LogOut, User, PanelLeftOpen, PanelLeftClose,
        Mail, Lock, Eye, EyeOff, LogIn, AlertCircle,
        SlidersHorizontal, X, Download,
  AlertTriangle, HeartPulse, CalendarClock, MapPin,
  TrendingUp, TrendingDown,

      }),
    ),
  ],
};