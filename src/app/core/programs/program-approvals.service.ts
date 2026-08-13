import { HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { ApiService } from '../api/api.service';
import { WrappedResponse } from '../api/wrapped-response.model';

/** The states a submitted programme can be in. Drafts never reach this queue. */
export type ProgramReviewState = 'pending_review' | 'approved' | 'rejected' | 'expired';

/** One row of GET /admin/programs. */
export interface ProgramSubmission {
  id: string;
  title: string;
  type: string;
  status: ProgramReviewState;
  orgId: string;
  orgName: string;
  orgContactEmail: string;
  description?: string | null;
  focus?: string | null;
  donor?: string | null;
  coordinator?: string | null;
  eligibilityCriteria: Array<{ field: string; operator: string; value: unknown }>;
  /** MINOR units (kobo). */
  budgetTotal?: number | null;
  slotsTotal?: number | null;
  expiresAt: string;
  createdAt: string;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
}

/**
 * The platform admin's programme review queue.
 *
 * Programmes were the one reviewable thing with no admin surface at all: the
 * PATCH endpoint existed, but nothing listed what was waiting, so a submitted
 * programme could never be approved and never reached a patient.
 */
@Injectable({ providedIn: 'root' })
export class ProgramApprovalsService {
  private readonly api = inject(ApiService);

  private readonly _submissions = signal<ProgramSubmission[]>([]);
  private readonly _loading = signal(false);

  readonly submissions = this._submissions.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly pendingCount = computed(
    () => this._submissions().filter(p => p.status === 'pending_review').length,
  );

  load(limit = 50): Observable<ProgramSubmission[]> {
    this._loading.set(true);
    return this.api
      .get<WrappedResponse<ProgramSubmission[]>>(
        '/admin/programs',
        new HttpParams().set('limit', limit),
      )
      .pipe(
        map(r => r.data),
        tap({
          next: rows => {
            this._submissions.set(rows);
            this._loading.set(false);
          },
          error: () => this._loading.set(false),
        }),
      );
  }

  // Programme review takes { status, reason } — the organisation shape — not the
  // { action, reason } the professional and benefactor endpoints use.
  approve(id: string): Observable<unknown> {
    return this.review(id, { status: 'approved' });
  }

  reject(id: string, reason: string): Observable<unknown> {
    return this.review(id, { status: 'rejected', reason });
  }

  private review(id: string, body: { status: string; reason?: string }): Observable<unknown> {
    return this.api
      .patch<WrappedResponse<unknown>>(`/admin/programs/${id}`, body)
      .pipe(tap(() => this.load().subscribe({ error: () => {} })));
  }
}

const STATUS_LABELS: Record<ProgramReviewState, string> = {
  pending_review: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  expired: 'Expired',
};

export function submissionStatusLabel(status: ProgramReviewState): string {
  return STATUS_LABELS[status] ?? status;
}
