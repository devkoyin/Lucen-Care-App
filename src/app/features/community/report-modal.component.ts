import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { REPORT_REASON_LABELS, ReportReason, ReportTargetType } from '../../core/community/community.models';
import { ConfirmModalComponent } from '../../shared/components/modal/confirm-modal.component';

export interface ReportSubmission {
  reason: ReportReason;
  details?: string;
}

/**
 * Reporting a post or a comment.
 *
 * Wraps ConfirmModalComponent, whose template already carries an <ng-content /> for
 * exactly this case — collecting input alongside a confirmation.
 */
@Component({
  selector: 'lc-report-modal',
  standalone: true,
  imports: [ConfirmModalComponent, FormsModule],
  templateUrl: './report-modal.component.html',
  styleUrl: './report-modal.component.scss',
})
export class ReportModalComponent {
  @Input() targetType: ReportTargetType = 'post';
  @Input() submitting = false;
  @Input() error: string | null = null;
  /** Set by the parent once the API has accepted it — the modal then self-closes. */
  @Input() set done(value: boolean) {
    this.submitted.set(value);
  }

  @Output() submitReport = new EventEmitter<ReportSubmission>();
  @Output() close = new EventEmitter<void>();

  readonly submitted = signal(false);
  readonly reason = signal<ReportReason | null>(null);
  readonly details = signal('');

  readonly reasons = Object.entries(REPORT_REASON_LABELS) as Array<[ReportReason, string]>;

  /** "Other" needs a note — the server rejects it otherwise, so say so up front. */
  detailsRequired(): boolean {
    return this.reason() === 'other';
  }

  canSubmit(): boolean {
    if (!this.reason()) return false;
    if (this.detailsRequired() && !this.details().trim()) return false;
    return !this.submitting;
  }

  submit(): void {
    if (!this.canSubmit()) return;
    const details = this.details().trim();
    this.submitReport.emit({ reason: this.reason()!, ...(details ? { details } : {}) });
  }
}
