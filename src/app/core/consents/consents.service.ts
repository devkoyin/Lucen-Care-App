import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { ApiService } from '../api/api.service';
import { WrappedResponse } from '../api/wrapped-response.model';
import { ConsentGrant, ConsentImpact, ConsentPurpose, ConsentStatus } from './consents.models';

/**
 * The patient's own consent grants.
 *
 * Until now nothing in the app called these endpoints, so a patient who declined a
 * purpose at onboarding had no way to change their mind — and the backend refused
 * the transition anyway. Both halves are fixed; this is the surface for it.
 */
@Injectable({ providedIn: 'root' })
export class ConsentsService {
  private readonly api = inject(ApiService);
  private readonly _grants = signal<ConsentGrant[]>([]);

  readonly grants = this._grants.asReadonly();

  load(): Observable<ConsentGrant[]> {
    return this.api
      .get<WrappedResponse<ConsentGrant[]>>('/consents/me')
      .pipe(map(r => r.data), tap(grants => this._grants.set(grants)));
  }

  /** Find the grant for a purpose, if the patient has a row for it at all. */
  forPurpose(purpose: ConsentPurpose): ConsentGrant | undefined {
    return this._grants().find(g => g.purpose === purpose);
  }

  /**
   * Move a grant to a new status. The backend enforces the state machine, so an
   * invalid target returns 409 rather than being silently ignored here.
   */
  transition(id: string, status: ConsentStatus): Observable<ConsentGrant> {
    return this.api
      .patch<WrappedResponse<ConsentGrant>>(`/consents/${id}`, { status })
      .pipe(map(r => r.data), tap(updated => this.replace(updated)));
  }

  /** Create a grant for a purpose the patient has no row for yet. */
  create(purpose: ConsentPurpose, dataScopes: string[]): Observable<ConsentGrant> {
    return this.api
      .post<WrappedResponse<ConsentGrant>>('/consents', { purpose, dataScopes })
      .pipe(map(r => r.data), tap(created => this.replace(created)));
  }

  /** What revoking would tear down — shown before the patient confirms. */
  impact(id: string): Observable<ConsentImpact> {
    return this.api
      .get<WrappedResponse<ConsentImpact>>(`/consents/${id}/impact`)
      .pipe(map(r => r.data));
  }

  private replace(grant: ConsentGrant): void {
    this._grants.update(list => {
      const idx = list.findIndex(g => g.id === grant.id);
      return idx === -1 ? [...list, grant] : list.map(g => (g.id === grant.id ? grant : g));
    });
  }
}
