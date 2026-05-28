import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AnalyticsQueryParams,
  PaginatedAccidentsResponse,
} from '../models/analytics-api.model';

@Injectable({ providedIn: 'root' })
export class AccidentsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/accidents`;

  getAccidents(
    filters: AnalyticsQueryParams,
    page = 1,
    limit = 50,
  ): Observable<PaginatedAccidentsResponse> {
    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit);

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<PaginatedAccidentsResponse>(this.base, { params });
  }

  exportXlsx(filters: AnalyticsQueryParams): Observable<Blob> {
    return this.http.post(
      `${this.base}/export`,
      { ...filters, format: 'xlsx' },
      { responseType: 'blob' },
    );
  }
}
