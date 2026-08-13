import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ApiErrorBody } from '../../../../core/api/wrapped-response.model';
import {
  BrowsableProgram,
  isFull,
  PatientProgramsService,
} from '../../../../core/programs/patient-programs.service';

/** Distinguishes the "you must consent first" case, which has its own remedy. */
const NO_CONSENT_HINT = 'consent';

@Component({
  selector: 'lc-available-plans',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './available-plans.component.html',
  styleUrl: './available-plans.component.scss',
})
export class AvailablePlansComponent implements OnInit {
  private readonly svc = inject(PatientProgramsService);

  readonly programs = this.svc.programs;
  readonly loading = signal(true);
  readonly loadError = signal(false);

  /** Programme id currently being applied for, so only its button disables. */
  readonly applyingId = signal<string | null>(null);
  readonly applyError = signal<string | null>(null);
  /** Set when the failure was "no active consent", which we can actually fix. */
  readonly needsConsent = signal(false);

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.svc.loadAll().subscribe({
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

  isApplied(id: string): boolean {
    return this.svc.isApplied(id);
  }

  /** Every place taken — the card stays, the button does not. */
  isFull(program: BrowsableProgram): boolean {
    return isFull(program);
  }

  /** An uncapped programme has no number to show, so it says so. */
  placesLabel(program: BrowsableProgram): string {
    if (program.slotsTotal == null) return 'Unlimited';
    const left = Math.max(0, program.slotsTotal - program.slotsFilled);
    return left === 0 ? 'None left' : `${left} of ${program.slotsTotal} left`;
  }

  apply(program: BrowsableProgram): void {
    if (this.isApplied(program.id) || this.isFull(program) || this.applyingId()) return;

    this.applyingId.set(program.id);
    this.applyError.set(null);
    this.needsConsent.set(false);

    this.svc.apply(program.id).subscribe({
      next: () => {
        this.applyingId.set(null);
        // Refresh enrollments so the card settles into its Applied state from the
        // server's view rather than an optimistic local flag.
        this.svc.loadEnrollments().subscribe({ error: () => {} });
      },
      error: (err: unknown) => {
        this.applyingId.set(null);
        this.handleApplyError(err);
      },
    });
  }

  /** Each backend refusal means something different to the patient. */
  private handleApplyError(err: unknown): void {
    const body = (err as { error?: ApiErrorBody } | undefined)?.error;
    const status = body?.status;
    const detail = body?.message ?? body?.detail ?? '';

    // 409: they already hold an active enrollment. Not an error worth showing —
    // just reconcile with the server, which will flip the card to Applied.
    if (status === 409) {
      this.svc.loadEnrollments().subscribe({ error: () => {} });
      return;
    }

    // 422 with a consent message is the one failure the patient can actually fix.
    if (status === 422 && detail.toLowerCase().includes(NO_CONSENT_HINT)) {
      this.needsConsent.set(true);
      this.applyError.set(
        'You need to allow sharing with NGO funding partners before you can apply.',
      );
      return;
    }

    if (status === 422) {
      this.applyError.set(
        detail || 'This programme is no longer accepting applications.',
      );
      return;
    }

    this.applyError.set('Could not submit your application. Please try again.');
  }
}
