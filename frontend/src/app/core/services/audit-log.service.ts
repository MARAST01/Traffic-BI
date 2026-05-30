import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuditLog, AuditLogFilters, AuditLogResponse } from '../models/audit-log.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/audit-logs`;

  /**
   * Registra una consulta. Llamar desde DashboardService al presionar Aplicar.
   * El backend extrae userId/email/role del JWT — solo enviamos filters y page.
   */
  register(filters: AuditLogFilters, page: string): Observable<AuditLog> {
    return this.http.post<AuditLog>(this.base, { filters, page });
  }

  /**
   * Lista todos los logs (solo Administrador).
   */
  getAll(page = 1, limit = 20): Observable<AuditLogResponse> {
    return this.http.get<AuditLogResponse>(this.base, {
      params: { page: String(page), limit: String(limit) },
    });
  }
}