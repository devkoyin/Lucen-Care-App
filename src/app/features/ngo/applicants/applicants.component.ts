import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { apiErrorMessage } from '../../../core/api/wrapped-response.model';
import { AuthService } from '../../../core/auth/auth.service';
import {
  Applicant,
  ApplicantsService,
  EnrollmentStatus,
  ReviewableStatus,
  applicantStatusLabel,
  applicantStatusTone,
  isReviewable,
} from '../../../core/programs/applicants.service';
import { NgoProgram, NgoProgramsService } from '../../../core/programs/ngo-programs.service';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ConfirmModalComponent } from '../../../shared/components/modal/confirm-modal.component';

type FilterTab = 'all' | EnrollmentStatus;

const TABS: { label: string; key: FilterTab }[] = [
  { label: 'All',              key: 'all' },
  { label: 'Awaiting review',  key: 'active' },
  { label: 'Selected',         key: 'selected' },
  { label: 'Waitlisted',       key: 'waitlisted' },
  { label: 'Not selected',     key: 'rejected' },
];

@Component({
  selector: 'lc-applicants',
  standalone: true,
  imports: [DatePipe, BadgeComponent, ConfirmModalComponent],
  templateUrl: './applicants.component.html',
  styleUrl: './applicants.component.scss',
})
export class ApplicantsComponent implements OnInit {
  private readonly svc = inject(ApplicantsService);
  private readonly programsSvc = inject(NgoProgramsService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly tabs = TABS;
  readonly applicants = this.svc.applicants;
  readonly programs = this.programsSvc.programs;

  readonly activeTab = signal<FilterTab>('all');
  readonly search = signal('');
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly busyId = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

  /** Deep-linked from the Programs screen's "Applicants" button. */
  private readonly queryProgramId = toSignal(
    this.route.queryParamMap.pipe(catchError(() => of(null))),
    { initialValue: null },
  );
  readonly selectedProgramId = signal<string | null>(null);

  // Rejection needs a reason, so it goes through a prompt rather than firing blind.
  readonly rejecting = signal<Applicant | null>(null);
  readonly rejectReason = signal('');

  readonly filtered = computed(() => {
    const tab = this.activeTab();
    const q = this.search().toLowerCase().trim();
    let rows = this.applicants();

    if (tab !== 'all') rows = rows.filter(a => a.status === tab);
    if (q) {
      rows = rows.filter(a => {
        const s = a.sharedDataSnapshot;
        return (
          (s.name ?? '').toLowerCase().includes(q) ||
          (s.conditionTags ?? []).some(t => t.toLowerCase().includes(q))
        );
      });
    }
    return rows;
  });

  readonly selectedProgram = computed(() =>
    this.programs().find(p => p.id === this.selectedProgramId()),
  );

  ngOnInit(): void {
    this.loadPrograms();
  }

  /** The queue is per-programme, so the programme list comes first. */
  private loadPrograms(): void {
    this.loading.set(true);
    this.auth
      .me()
      .pipe(
        switchMap(me => (me.orgId ? this.programsSvc.load(me.orgId) : of(null))),
        catchError(() => of(null)),
      )
      .subscribe(programs => {
        if (programs === null) {
          this.loadError.set(true);
          this.loading.set(false);
          return;
        }
        const fromQuery = this.queryProgramId()?.get('programId');
        const initial = programs.find(p => p.id === fromQuery) ?? programs[0];
        if (!initial) {
          this.loading.set(false);
          return;
        }
        this.selectProgram(initial.id);
      });
  }

  selectProgram(programId: string): void {
    this.selectedProgramId.set(programId);
    this.loading.set(true);
    this.actionError.set(null);
    this.svc.load(programId).subscribe({
      next: () => {
        this.loadError.set(false);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  setTab(tab: FilterTab): void {
    this.activeTab.set(tab);
  }

  select(applicant: Applicant): void {
    this.review(applicant, 'selected');
  }

  waitlist(applicant: Applicant): void {
    this.review(applicant, 'waitlisted');
  }

  /** Step one of rejecting: capture the reason the patient will be shown. */
  startReject(applicant: Applicant): void {
    this.rejectReason.set('');
    this.actionError.set(null);
    this.rejecting.set(applicant);
  }

  confirmReject(): void {
    const applicant = this.rejecting();
    const reason = this.rejectReason().trim();
    // The API rejects an empty reason with a 422; don't spend a round-trip on it.
    if (!applicant || !reason) return;

    this.review(applicant, 'rejected', reason, () => this.rejecting.set(null));
  }

  cancelReject(): void {
    this.rejecting.set(null);
    this.rejectReason.set('');
  }

  private review(
    applicant: Applicant,
    status: ReviewableStatus,
    reason?: string,
    onDone?: () => void,
  ): void {
    const programId = this.selectedProgramId();
    if (!programId || this.busyId()) return;

    this.busyId.set(applicant.id);
    this.actionError.set(null);

    this.svc.review(programId, applicant.id, status, reason).subscribe({
      next: () => {
        this.busyId.set(null);
        onDone?.();
        // Selecting consumes a place, so the programme's counters have moved.
        this.refreshProgramCounters();
      },
      error: (err: unknown) => {
        this.busyId.set(null);
        this.actionError.set(apiErrorMessage(err, 'Could not record that decision.'));
      },
    });
  }

  private refreshProgramCounters(): void {
    this.auth
      .me()
      .pipe(switchMap(me => (me.orgId ? this.programsSvc.load(me.orgId) : of(null))))
      .subscribe({ error: () => {} });
  }

  isBusy(applicant: Applicant): boolean {
    return this.busyId() === applicant.id;
  }

  canReview(applicant: Applicant): boolean {
    return isReviewable(applicant.status);
  }

  /** A full programme cannot take another selection — the API returns 409. */
  isFull(): boolean {
    return this.selectedProgram()?.lifecycle === 'Full';
  }

  countFor(tab: FilterTab): number {
    const rows = this.applicants();
    return tab === 'all' ? rows.length : rows.filter(a => a.status === tab).length;
  }

  statusLabel(status: EnrollmentStatus): string {
    return applicantStatusLabel(status);
  }

  statusTone(status: EnrollmentStatus): 'success' | 'warning' | 'error' | 'neutral' {
    return applicantStatusTone(status);
  }

  initialFor(applicant: Applicant): string {
    return (applicant.sharedDataSnapshot.name ?? '?')[0].toUpperCase();
  }

  programLabel(p: NgoProgram): string {
    return `${p.title} (${p.slotsFilled}${p.slotsTotal ? '/' + p.slotsTotal : ''})`;
  }
}
