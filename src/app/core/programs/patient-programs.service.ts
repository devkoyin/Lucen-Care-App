import { HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { ApiService } from '../api/api.service';
import { WrappedResponse } from '../api/wrapped-response.model';

/** A programme as GET /programs/browse returns it, post-select-fix. */
export interface BrowsableProgram {
  id: string;
  orgId: string;
  title: string;
  type: string;
  expiresAt: string;
}

/** Mirrors the backend EnrollmentStatus. */
export type PatientEnrollmentStatus =
  | 'active'
  | 'selected'
  | 'waitlisted'
  | 'rejected'
  | 'revoked_by_patient'
  | 'expired';

/** One row of GET /enrollments. */
export interface PatientEnrollment {
  id: string;
  programId: string;
  status: PatientEnrollmentStatus;
  createdAt: string;
  /** Set only once an NGO has reviewed the application. */
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  programTitle: string;
  programType: string;
  programExpiresAt: string;
  orgName?: string | null;
}

/**
 * Statuses that still occupy the patient's attention. A programme is only re-applicable
 * once its enrollment leaves this set, which is also what the backend's duplicate check
 * enforces — the two must agree or the UI offers an Apply the API will 409.
 */
const LIVE_STATUSES: readonly PatientEnrollmentStatus[] = ['active', 'selected', 'waitlisted'];

interface EnrollmentListData {
  enrollments: PatientEnrollment[];
  nextCursor?: string;
}

/**
 * The patient's view of NGO funding programmes.
 *
 * Replaces the patient half of NgoProgramsService, which was a hardcoded SEED array
 * shared with the NGO portal, and whose "apply" was a Set<string> in memory that a
 * refresh discarded. Applied state is now derived from real enrollments.
 */
@Injectable({ providedIn: 'root' })
export class PatientProgramsService {
  private readonly api = inject(ApiService);

  private readonly _programs = signal<BrowsableProgram[]>([]);
  private readonly _enrollments = signal<PatientEnrollment[]>([]);

  readonly programs = this._programs.asReadonly();
  readonly enrollments = this._enrollments.asReadonly();

  /**
   * Programme ids the patient currently holds a live enrollment for. Withdrawn, expired
   * and rejected enrollments are excluded so those programmes become applicable again.
   */
  readonly appliedProgramIds = computed(
    () =>
      new Set(
        this._enrollments()
          .filter(e => LIVE_STATUSES.includes(e.status))
          .map(e => e.programId),
      ),
  );

  /** Both feeds together — the browse list is meaningless without applied state. */
  loadAll(): Observable<[BrowsableProgram[], PatientEnrollment[]]> {
    return forkJoin([this.loadPrograms(), this.loadEnrollments()]);
  }

  loadPrograms(limit = 50): Observable<BrowsableProgram[]> {
    return this.api
      .get<WrappedResponse<BrowsableProgram[]>>('/programs/browse', new HttpParams().set('limit', limit))
      .pipe(map(r => r.data), tap(programs => this._programs.set(programs)));
  }

  loadEnrollments(): Observable<PatientEnrollment[]> {
    return this.api
      .get<WrappedResponse<EnrollmentListData>>('/enrollments')
      .pipe(map(r => r.data.enrollments), tap(rows => this._enrollments.set(rows)));
  }

  /** POST /enrollments — the act of applying. Callers must handle 422 and 409. */
  apply(programId: string): Observable<PatientEnrollment> {
    return this.api
      .post<WrappedResponse<PatientEnrollment>>('/enrollments', { programId })
      .pipe(map(r => r.data));
  }

  /**
   * DELETE /enrollments/:id — leave ONE programme. Distinct from revoking the NGO
   * consent grant, which withdraws the patient from every programme at once.
   */
  withdraw(enrollmentId: string): Observable<PatientEnrollment> {
    return this.api
      .delete<WrappedResponse<PatientEnrollment>>(`/enrollments/${enrollmentId}`)
      .pipe(
        map(r => r.data),
        tap(updated =>
          this._enrollments.update(list =>
            list.map(e => (e.id === updated.id ? { ...e, status: updated.status } : e)),
          ),
        ),
      );
  }

  isApplied(programId: string): boolean {
    return this.appliedProgramIds().has(programId);
  }
}

const STATUS_LABELS: Record<PatientEnrollmentStatus, string> = {
  active: 'Under review',
  selected: 'Selected',
  waitlisted: 'Waitlisted',
  rejected: 'Not approved',
  revoked_by_patient: 'Withdrawn',
  expired: 'Expired',
};

export function enrollmentStatusLabel(status: PatientEnrollmentStatus): string {
  return STATUS_LABELS[status] ?? status;
}

/** Withdrawal is the patient's own action, so it is offered only while still in play. */
export function canWithdraw(status: PatientEnrollmentStatus): boolean {
  return status === 'active' || status === 'waitlisted';
}
