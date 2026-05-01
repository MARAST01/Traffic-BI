import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, throwError } from 'rxjs';
import { User, AuthResponse, LoginCredentials, ROLE_PERMISSIONS } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = 'http://localhost:3000/api';
  private readonly TOKEN_KEY = 'traffic_bi_token';

  // Signals reactivos (Angular 17+)
  private _user    = signal<User | null>(null);
  private _loading = signal<boolean>(false);

  // Computados públicos
  readonly user          = this._user.asReadonly();
  readonly loading       = this._loading.asReadonly();
  readonly isAuthenticated = computed(() => !!this._user());
  readonly userRole        = computed(() => this._user()?.role);
  readonly userName        = computed(() => this._user()?.name);

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    this.restoreSession();
  }

  login(credentials: LoginCredentials) {
    this._loading.set(true);

    return this.http.post<AuthResponse>(`${this.API}/auth/login`, credentials).pipe(
      tap(response => {
        localStorage.setItem(this.TOKEN_KEY, response.accessToken);
        this._user.set(response.user);
        this._loading.set(false);
      }),
      catchError(err => {
        this._loading.set(false);
        return throwError(() => err);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  hasPermission(module: string): boolean {
    const role = this._user()?.role;
    if (!role) return false;
    return ROLE_PERMISSIONS[role]?.includes(module) ?? false;
  }

  private restoreSession(): void {
    const token = this.getToken();
    if (!token) return;

    // Verificar token con el backend
    this.http.get<User>(`${this.API}/auth/me`).subscribe({
      next: user => this._user.set(user),
      error: () => this.logout(),
    });
  }
}