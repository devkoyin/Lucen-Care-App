import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { apiErrorMessage } from '../../../core/api/wrapped-response.model';
import {
  CommunityModerationService,
  reportReasonLabel,
  reportStatusLabel,
} from '../../../core/community/community-moderation.service';
import { CommunityReport, ReportReason, ReportStatus, timeAgo } from '../../../core/community/community.models';
import { ReasonNoteComponent } from '../../../shared/components/reason-note/reason-note.component';

type FilterTab = 'all' | ReportStatus;

/**
 * The community moderation queue.
 *
 * Same interaction as the five approval screens — tabs, expandable card, an inline
 * reason that is required before the destructive action. There was no moderation
 * surface at all before this: reports had nowhere to land, which made the reporting
 * affordance a promise the platform could not keep.
 */
@Component({
  selector: 'lc-community-moderation',
  standalone: true,
  imports: [ReasonNoteComponent],
  templateUrl: './community-moderation.component.html',
  styleUrl: './community-moderation.component.scss',
})
export class CommunityModerationComponent implements OnInit {
  private readonly svc = inject(CommunityModerationService);

  readonly loading = this.svc.loading;
  readonly reports = this.svc.reports;

  readonly tabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'actioned', label: 'Removed' },
    { id: 'dismissed', label: 'Dismissed' },
  ];

  readonly activeTab = signal<FilterTab>('pending');
  readonly expandedId = signal<string | null>(null);
  readonly hidingId = signal<string | null>(null);
  readonly hideNote = signal('');
  readonly loadError = signal(false);
  readonly actionError = signal<string | null>(null);

  readonly filtered = computed(() => {
    const tab = this.activeTab();
    const rows = this.reports();
    return tab === 'all' ? rows : rows.filter(r => r.status === tab);
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
    const rows = this.reports();
    return tab === 'all' ? rows.length : rows.filter(r => r.status === tab).length;
  }

  setTab(tab: FilterTab): void {
    this.activeTab.set(tab);
  }

  toggleExpand(id: string): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  startHide(id: string): void {
    this.hidingId.set(id);
    this.hideNote.set('');
    this.actionError.set(null);
  }

  cancelHide(): void {
    this.hidingId.set(null);
  }

  confirmHide(id: string): void {
    // The API 422s a hide with no note — and the note is what the author reads, so
    // an empty one removes their post and teaches them nothing.
    const note = this.hideNote().trim();
    if (!note) return;

    this.svc.hide(id, note).subscribe({
      error: (err: unknown) => this.actionError.set(apiErrorMessage(err, 'Could not remove this content.')),
    });
    this.hidingId.set(null);
    this.expandedId.set(null);
  }

  dismiss(id: string): void {
    this.actionError.set(null);
    this.svc.dismiss(id).subscribe({
      error: (err: unknown) => this.actionError.set(apiErrorMessage(err, 'Could not dismiss this report.')),
    });
    this.expandedId.set(null);
  }

  statusLabel(status: ReportStatus): string {
    return reportStatusLabel(status);
  }

  reasonLabel(reason: ReportReason): string {
    return reportReasonLabel(reason);
  }

  when(iso: string): string {
    return timeAgo(iso);
  }

  /** The queue lists both posts and comments; the row has to say which. */
  targetLabel(report: CommunityReport): string {
    return report.targetType === 'post' ? 'Post' : 'Comment';
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
