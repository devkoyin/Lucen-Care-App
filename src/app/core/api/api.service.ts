import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { WrappedResponse } from './wrapped-response.model';

// The refresh token is an httpOnly cookie; without this it is never sent and
// POST /auth/refresh can never succeed cross-origin. The API sets
// `Access-Control-Allow-Credentials: true`.
const OPTS = { withCredentials: true } as const;

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  get<T>(path: string, params?: HttpParams) {
    return this.http.get<T>(`${this.base}${path}`, { ...OPTS, params });
  }

  post<T>(path: string, body: unknown) {
    return this.http.post<T>(`${this.base}${path}`, body, OPTS);
  }

  patch<T>(path: string, body: unknown) {
    return this.http.patch<T>(`${this.base}${path}`, body, OPTS);
  }

  delete<T>(path: string) {
    return this.http.delete<T>(`${this.base}${path}`, OPTS);
  }

  // Unwrapping variants — every successful API response is wrapped in
  // { data, meta, traceId }, so callers almost always want just `data`.

  getData<T>(path: string, params?: HttpParams): Observable<T> {
    return this.get<WrappedResponse<T>>(path, params).pipe(map(r => r.data));
  }

  postData<T>(path: string, body: unknown): Observable<T> {
    return this.post<WrappedResponse<T>>(path, body).pipe(map(r => r.data));
  }

  patchData<T>(path: string, body: unknown): Observable<T> {
    return this.patch<WrappedResponse<T>>(path, body).pipe(map(r => r.data));
  }
}
