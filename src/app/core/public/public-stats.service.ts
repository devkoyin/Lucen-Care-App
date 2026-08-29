import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api/api.service';

/**
 * Aggregate platform totals, as GET /public/stats returns them.
 *
 * The only unauthenticated read in the app — the landing page has no token to
 * send. The endpoint is cached and rate-limited server side, so callers do not
 * need to throttle it themselves.
 */
export interface PlatformStats {
  patients: number;
  ngoPrograms: number;
}

@Injectable({ providedIn: 'root' })
export class PublicStatsService {
  private readonly api = inject(ApiService);

  getStats(): Observable<PlatformStats> {
    return this.api.getData<PlatformStats>('/public/stats');
  }
}
