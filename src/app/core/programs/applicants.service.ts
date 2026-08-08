import { HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { ApiService } from '../api/api.service';
import { WrappedResponse } from '../api/wrapped-response.model';

/** Mirrors the backend EnrollmentStatus. */
export type EnrollmentStatus =
  | 'active'
  | 'selected'
  | 'waitlisted'
  | 'rejected'
  | 'revoked_by_patient'
  | 'expired';

/** The three an NGO reviewer may set. */
export type ReviewableStatus = Extract<EnrollmentStatus, 'selected' | 'waitlisted' | 'rejected'>;

/**
 * One applicant, as GET /programs/:id/enrollments returns it.
 *
 * `sharedDataSnapshot` is a point-in-time copy captured when the patient applied —
 * the API deliberately does not expose patientId or the live patient record, so an
 * NGO cannot correlate applicants across programmes.
 */
export interface Applicant {
  id: string;
  status: EnrollmentStatus;
  createdAt: string;
  rejectionReason?: string;
  reviewedAt?: string;
  sharedDataSnapshot: {
    name?: string;
    conditionTags?: string[];
    address?: string | null;
    directContactShared?: boolean;
  };
}

@Injectable({ providedIn: 'root' })
export class ApplicantsService {
  private readonly api = inject(ApiService);

  private readonly _applicants = signal<Applicant[]>([]);
  readonly applicants = this._applicants.asReadonly();

  load(programId: string, limit = 50): Observable<Applicant[]> {
    return this.api
      .get<WrappedResponse<Applicant[]>>(
        `/programs/${programId}/enrollments`,
        new HttpParams().set('limit', limit),
      )
      .pipe(map(r => r.data), tap(rows => this._applicants.set(rows)));
  }

  /** Select, waitlist or reject. A reason is required by the API on rejection. */
  review(
    programId: string,
    enrollmentId: string,
    status: ReviewableStatus,
    reason?: string,
  ): Observable<Applicant> {
    return this.api
      .patch<WrappedResponse<Applicant>>(`/programs/${programId}/enrollments/${enrollmentId}`, {
        status,
        ...(reason ? { reason } : {}),
      })
      .pipe(map(r => r.data), tap(updated => this.replace(updated)));
  }

  clear(): void {
    this._applicants.set([]);
  }

  private replace(applicant: Applicant): void {
    this._applicants.update(list => list.map(a => (a.id === applicant.id ? applicant : a)));
  }
}

const STATUS_LABELS: Record<EnrollmentStatus, string> = {
  active: 'Awaiting review',
  selected: 'Selected',
  waitlisted: 'Waitlisted',
  rejected: 'Not selected',
  revoked_by_patient: 'Withdrawn',
  expired: 'Expired',
};

export function applicantStatusLabel(status: EnrollmentStatus): string {
  return STATUS_LABELS[status] ?? status;
}

/** Maps to the badge tones the shared component already understands. */
export function applicantStatusTone(
  status: EnrollmentStatus,
): 'success' | 'warning' | 'error' | 'neutral' {
  if (status === 'selected') return 'success';
  if (status === 'waitlisted') return 'warning';
  if (status === 'rejected') return 'error';
  return 'neutral';
}

/**
 * Withdrawn and expired belong to the patient and the system — the API refuses to
 * review them, so the UI must not offer the buttons.
 */
export function isReviewable(status: EnrollmentStatus): boolean {
  return status !== 'revoked_by_patient' && status !== 'expired';
}
