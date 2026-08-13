import { HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { ApiService } from '../api/api.service';
import { WrappedResponse } from '../api/wrapped-response.model';
import { CommunityReport, ReportReason, ReportStatus } from './community.models';

/**
 * The platform admin's community moderation queue.
 *
 * Modelled on ProgramApprovalsService, including its `pendingCount` — the admin
 * dashboard consumes it the same way.
 */
@Injectable({ providedIn: 'root' })
export class CommunityModerationService {
  private readonly api = inject(ApiService);

  private readonly _reports = signal<CommunityReport[]>([]);
  private readonly _loading = signal(false);

  readonly reports = this._reports.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly pendingCount = computed(() => this._reports().filter(r => r.status === 'pending').length);

  load(limit = 50): Observable<CommunityReport[]> {
    this._loading.set(true);
    return this.api
      .get<WrappedResponse<CommunityReport[]>>(
        '/admin/community/reports',
        new HttpParams().set('limit', limit),
      )
      .pipe(
        map(r => r.data),
        tap({
          next: rows => {
            this._reports.set(rows);
            this._loading.set(false);
          },
          error: () => this._loading.set(false),
        }),
      );
  }

  /** Removes the content. The note is required and is shown to the author verbatim. */
  hide(id: string, note: string): Observable<unknown> {
    return this.resolve(id, { action: 'hide', note });
  }

  /** Leaves the content in place and closes only this report. */
  dismiss(id: string, note?: string): Observable<unknown> {
    return this.resolve(id, { action: 'dismiss', ...(note ? { note } : {}) });
  }

  private resolve(id: string, body: { action: string; note?: string }): Observable<unknown> {
    return this.api
      .patch<WrappedResponse<unknown>>(`/admin/community/reports/${id}`, body)
      // Refetch rather than patch one row: hiding closes every other pending report
      // on the same target, so more than the named row changes.
      .pipe(tap(() => this.load().subscribe({ error: () => {} })));
  }
}

const STATUS_LABELS: Record<ReportStatus, string> = {
  pending: 'Awaiting review',
  actioned: 'Content removed',
  dismissed: 'Dismissed',
};

const REASON_LABELS: Record<ReportReason, string> = {
  misinformation: 'Misleading health information',
  medical_advice: 'Individual medical advice',
  personal_data: 'Personal or contact details',
  harassment: 'Harassment or abuse',
  spam: 'Spam or advertising',
  other: 'Other',
};

export function reportStatusLabel(status: ReportStatus): string {
  return STATUS_LABELS[status] ?? status;
}

export function reportReasonLabel(reason: ReportReason): string {
  return REASON_LABELS[reason] ?? reason;
}
