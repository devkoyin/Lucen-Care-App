import { HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { ApiService } from '../api/api.service';
import { WrappedResponse } from '../api/wrapped-response.model';

/**
 * The operational state of a programme, derived server-side from pausedAt, slot
 * counts and expiry. Distinct from the platform review state — a programme can be
 * approved AND full at the same time, which one combined field could not express.
 */
export type ProgramLifecycle = 'Draft' | 'Active' | 'Closing' | 'Full' | 'Paused' | 'Expired';

/** Platform review state, as stored. */
export type ProgramReviewStatus = 'pending_review' | 'approved' | 'rejected' | 'expired';

/** A programme as GET /organizations/:orgId/programs returns it. */
export interface NgoProgram {
  id: string;
  orgId: string;
  title: string;
  type: string;
  status: ProgramReviewStatus;
  lifecycle: ProgramLifecycle;
  eligibilityCriteria: Array<{ field: string; operator: string; value: unknown }>;
  expiresAt: string;
  description?: string;
  focus?: string;
  donor?: string;
  coordinator?: string;
  /** MINOR units (kobo) — run through toNaira before display. */
  budgetTotal?: number;
  budgetDisbursed: number;
  slotsTotal?: number;
  slotsFilled: number;
  slotsAvailable: number;
  pausedAt?: string | null;
}

/** GET /organizations/:orgId/stats — dashboard headline numbers, counted in SQL. */
export interface OrgStats {
  activePrograms: number;
  totalPrograms: number;
  totalApplicants: number;
  pendingReview: number;
  selectedPatients: number;
  waitlisted: number;
  rejected: number;
  /** MINOR units (kobo) — run through toNaira before display. */
  budgetTotal: number;
  budgetDisbursed: number;
  slotsTotal: number;
  slotsFilled: number;
}

/**
 * GET /organizations/:orgId/patient-map — applicants per state.
 *
 * Aggregates only: the API returns counts, never a patient's own location, because
 * location is deliberately absent from the consented snapshot.
 */
export interface PatientMapRow {
  state: string;
  selected: number;
  inReview: number;
  waitlisted: number;
  total: number;
  topCondition?: string;
}

export interface CreateProgramPayload {
  title: string;
  type: 'ngo_funding';
  eligibilityCriteria: Array<{ field: string; operator: string; value: unknown }>;
  expiresAt: string;
  description?: string;
  focus?: string;
  donor?: string;
  coordinator?: string;
  budgetTotal?: number;
  slotsTotal?: number;
}

/**
 * `type` and `eligibilityCriteria` are absent by design: the API refuses to change
 * who qualifies once patients have applied under the original terms.
 */
export type UpdateProgramPayload = Partial<
  Omit<CreateProgramPayload, 'type' | 'eligibilityCriteria'>
> & { paused?: boolean };

/** Money crosses the wire in kobo so it cannot drift; convert once, at the edge. */
export function toNaira(minorUnits?: number): number {
  return (minorUnits ?? 0) / 100;
}

export function toKobo(naira: number): number {
  return Math.round(naira * 100);
}

/**
 * An NGO's own programmes, from the API.
 *
 * Replaces a hardcoded SEED array that was shared with the patient portal via a root
 * singleton — so editing a fixture changed both, and the NGO's pause button would
 * have silently mutated what patients saw in Available Plans.
 */
@Injectable({ providedIn: 'root' })
export class NgoProgramsService {
  private readonly api = inject(ApiService);

  private readonly _programs = signal<NgoProgram[]>([]);
  readonly programs = this._programs.asReadonly();

  private readonly _stats = signal<OrgStats | null>(null);
  readonly stats = this._stats.asReadonly();

  readonly activePrograms = computed(() =>
    this._programs().filter(p => p.lifecycle === 'Active' || p.lifecycle === 'Closing'),
  );

  load(orgId: string, limit = 50): Observable<NgoProgram[]> {
    return this.api
      .get<WrappedResponse<NgoProgram[]>>(
        `/organizations/${orgId}/programs`,
        new HttpParams().set('limit', limit),
      )
      .pipe(map(r => r.data), tap(programs => this._programs.set(programs)));
  }

  loadStats(orgId: string): Observable<OrgStats> {
    return this.api
      .get<WrappedResponse<OrgStats>>(`/organizations/${orgId}/stats`)
      .pipe(map(r => r.data), tap(stats => this._stats.set(stats)));
  }

  loadPatientMap(orgId: string): Observable<PatientMapRow[]> {
    return this.api
      .get<WrappedResponse<PatientMapRow[]>>(`/organizations/${orgId}/patient-map`)
      .pipe(map(r => r.data));
  }

  create(payload: CreateProgramPayload): Observable<NgoProgram> {
    return this.api
      .post<WrappedResponse<NgoProgram>>('/programs', payload)
      .pipe(map(r => r.data), tap(created => this._programs.update(list => [...list, created])));
  }

  update(id: string, payload: UpdateProgramPayload): Observable<NgoProgram> {
    return this.api
      .patch<WrappedResponse<NgoProgram>>(`/programs/${id}`, payload)
      .pipe(map(r => r.data), tap(updated => this.replace(updated)));
  }

  setPaused(id: string, paused: boolean): Observable<NgoProgram> {
    return this.update(id, { paused });
  }

  slotsAvailable(p: NgoProgram): number {
    return p.slotsAvailable;
  }

  /** Guarded: an uncapped programme must render 0%, never NaN. */
  fillPercent(p: NgoProgram): number {
    if (!p.slotsTotal) return 0;
    return Math.min(100, Math.round((p.slotsFilled / p.slotsTotal) * 100));
  }

  budgetPercent(p: NgoProgram): number {
    if (!p.budgetTotal) return 0;
    return Math.min(100, Math.round((p.budgetDisbursed / p.budgetTotal) * 100));
  }

  private replace(program: NgoProgram): void {
    this._programs.update(list => list.map(p => (p.id === program.id ? program : p)));
  }
}
