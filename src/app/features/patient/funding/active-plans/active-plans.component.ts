import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { apiErrorMessage } from '../../../../core/api/wrapped-response.model';
import {
  PatientEnrollment,
  PatientEnrollmentStatus,
  PatientProgramsService,
  canWithdraw,
  enrollmentStatusLabel,
} from '../../../../core/programs/patient-programs.service';
import { ConfirmModalComponent } from '../../../../shared/components/modal/confirm-modal.component';
import { ReasonNoteComponent } from '../../../../shared/components/reason-note/reason-note.component';

interface ApplicationGroup {
  status: PatientEnrollmentStatus;
  label: string;
  /** Explains the state in the patient's own terms — none of this is on the API. */
  hint: string;
  rows: PatientEnrollment[];
}

/**
 * Order matters: what the patient most needs to see comes first. Decisions before
 * pending, pending before history.
 */
const GROUPS: { status: PatientEnrollmentStatus; label: string; hint: string }[] = [
  { status: 'selected',   label: 'Selected',    hint: 'You have a place on these programmes. The NGO will contact you with next steps.' },
  { status: 'waitlisted', label: 'Waitlisted',  hint: 'You are next in line if a place frees up.' },
  { status: 'active',     label: 'Under review', hint: 'The NGO has your application and has not decided yet.' },
  { status: 'rejected',   label: 'Not approved', hint: 'These applications were not successful this time.' },
  { status: 'revoked_by_patient', label: 'Withdrawn', hint: 'You withdrew from these programmes.' },
  { status: 'expired',    label: 'Expired',     hint: 'These programmes closed before a decision was reached.' },
];

@Component({
  selector: 'lc-active-plans',
  standalone: true,
  imports: [RouterLink, DatePipe, ConfirmModalComponent, ReasonNoteComponent],
  templateUrl: './active-plans.component.html',
  styleUrl: './active-plans.component.scss',
})
export class ActivePlansComponent implements OnInit {
  private readonly svc = inject(PatientProgramsService);

  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly actionError = signal<string | null>(null);
  readonly withdrawingId = signal<string | null>(null);

  readonly withdrawTarget = signal<PatientEnrollment | null>(null);

  readonly applications = computed(() => this.svc.enrollments());

  /** Only groups with rows render, so an empty history stays out of the way. */
  readonly groups = computed<ApplicationGroup[]>(() => {
    const rows = this.applications();
    return GROUPS.map(g => ({ ...g, rows: rows.filter(r => r.status === g.status) })).filter(
      g => g.rows.length > 0,
    );
  });

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.svc.loadEnrollments().subscribe({
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

  statusLabel(status: PatientEnrollmentStatus): string {
    return enrollmentStatusLabel(status);
  }

  /** Drives the badge modifier class; the SCSS knows these four tones. */
  statusTone(status: PatientEnrollmentStatus): string {
    if (status === 'selected') return 'success';
    if (status === 'waitlisted') return 'pending';
    if (status === 'rejected') return 'error';
    return 'neutral';
  }

  canWithdraw(row: PatientEnrollment): boolean {
    return canWithdraw(row.status);
  }

  askWithdraw(row: PatientEnrollment): void {
    this.actionError.set(null);
    this.withdrawTarget.set(row);
  }

  cancelWithdraw(): void {
    this.withdrawTarget.set(null);
  }

  confirmWithdraw(): void {
    const row = this.withdrawTarget();
    if (!row || this.withdrawingId()) return;

    this.withdrawingId.set(row.id);
    this.actionError.set(null);

    this.svc.withdraw(row.id).subscribe({
      next: () => {
        this.withdrawingId.set(null);
        this.withdrawTarget.set(null);
      },
      error: (err: unknown) => {
        this.withdrawingId.set(null);
        this.actionError.set(apiErrorMessage(err, 'Could not withdraw your application.'));
      },
    });
  }

  isWithdrawing(row: PatientEnrollment): boolean {
    return this.withdrawingId() === row.id;
  }
}
