import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { apiErrorMessage } from '../../../core/api/wrapped-response.model';
import {
  ProgramApprovalsService,
  ProgramReviewState,
  ProgramSubmission,
  submissionStatusLabel,
} from '../../../core/programs/program-approvals.service';
import { toNaira } from '../../../core/programs/ngo-programs.service';
import { ReasonNoteComponent } from '../../../shared/components/reason-note/reason-note.component';

type FilterTab = 'all' | ProgramReviewState;

/**
 * The platform's programme review queue.
 *
 * Same shape as the four approval screens that already work — tabs, expandable
 * card, inline reject reason. Programmes were the gap: the review endpoint existed
 * with no way to reach it, so nothing an NGO submitted could ever go live.
 */
@Component({
  selector: 'lc-program-approvals',
  standalone: true,
  imports: [ReasonNoteComponent],
  templateUrl: './program-approvals.component.html',
  styleUrl: './program-approvals.component.scss',
})
export class ProgramApprovalsComponent implements OnInit {
  private readonly svc = inject(ProgramApprovalsService);

  readonly loading = this.svc.loading;
  readonly submissions = this.svc.submissions;

  readonly tabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'pending_review', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
  ];

  readonly activeTab = signal<FilterTab>('pending_review');
  readonly expandedId = signal<string | null>(null);
  readonly rejectingId = signal<string | null>(null);
  readonly rejectReason = signal('');
  readonly loadError = signal(false);
  readonly actionError = signal<string | null>(null);

  readonly filtered = computed(() => {
    const tab = this.activeTab();
    const rows = this.submissions();
    return tab === 'all' ? rows : rows.filter(p => p.status === tab);
  });

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.svc.load().subscribe({
      next: () => this.loadError.set(false),
      error: () => this.loadError.set(true),
    });
  }

  countFor(tab: FilterTab): number {
    const rows = this.submissions();
    return tab === 'all' ? rows.length : rows.filter(p => p.status === tab).length;
  }

  setTab(tab: FilterTab): void {
    this.activeTab.set(tab);
  }

  toggleExpand(id: string): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  approve(id: string): void {
    this.actionError.set(null);
    this.svc.approve(id).subscribe({
      error: (err: unknown) =>
        this.actionError.set(apiErrorMessage(err, 'Could not approve this programme.')),
    });
    this.expandedId.set(null);
  }

  startReject(id: string): void {
    this.rejectingId.set(id);
    this.rejectReason.set('');
    this.actionError.set(null);
  }

  confirmReject(id: string): void {
    // The API rejects a reject-without-reason with a 422 — and the reason is what
    // the NGO reads on its own card, so an empty one helps nobody.
    const reason = this.rejectReason().trim();
    if (!reason) return;

    this.svc.reject(id, reason).subscribe({
      error: (err: unknown) =>
        this.actionError.set(apiErrorMessage(err, 'Could not reject this programme.')),
    });
    this.rejectingId.set(null);
    this.expandedId.set(null);
  }

  cancelReject(): void {
    this.rejectingId.set(null);
  }

  statusLabel(status: ProgramReviewState): string {
    return submissionStatusLabel(status);
  }

  /** Kobo in, readable naira out. */
  budgetLabel(program: ProgramSubmission): string {
    if (!program.budgetTotal) return 'Not set';
    const naira = toNaira(program.budgetTotal);
    if (naira >= 1_000_000) return `₦${(naira / 1_000_000).toFixed(1)}M`;
    if (naira >= 1_000) return `₦${(naira / 1_000).toFixed(0)}K`;
    return `₦${naira.toFixed(0)}`;
  }

  criterionLabel(c: { field: string; operator: string; value: unknown }): string {
    const value = Array.isArray(c.value) ? c.value.join(', ') : String(c.value);
    return `${c.field} ${c.operator} ${value}`;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}
