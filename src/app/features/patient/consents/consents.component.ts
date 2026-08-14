import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { apiErrorMessage } from '../../../core/api/wrapped-response.model';
import { ConsentsService } from '../../../core/consents/consents.service';
import {
  CONSENT_DEFAULT_SCOPES,
  CONSENT_PURPOSE_COPY,
  CONSENT_SCOPE_LABELS,
  ConsentGrant,
  ConsentImpact,
  ConsentPurpose,
  canGrant,
  canPause,
  canRevoke,
  consentStatusLabel,
} from '../../../core/consents/consents.models';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ConfirmModalComponent } from '../../../shared/components/modal/confirm-modal.component';
import { BackLinkComponent } from '../../../shared/components/back-link/back-link.component';

/** Every purpose is listed, whether or not the patient has a grant row for it. */
const ALL_PURPOSES: ConsentPurpose[] = ['ngo_funding', 'clinical_research_recruitment', 'hmo_care'];

interface ConsentRow {
  purpose: ConsentPurpose;
  title: string;
  description: string;
  scopes: string[];
  grant?: ConsentGrant;
  status: string;
  badge: 'success' | 'warning' | 'neutral' | 'error';
  canGrant: boolean;
  canPause: boolean;
  canRevoke: boolean;
}

@Component({
  selector: 'lc-patient-consents',
  standalone: true,
  imports: [BadgeComponent, ConfirmModalComponent, BackLinkComponent],
  templateUrl: './consents.component.html',
  styleUrl: './consents.component.scss',
})
export class PatientConsentsComponent implements OnInit {
  private readonly service = inject(ConsentsService);

  readonly loading = signal(true);
  readonly loadError = signal(false);
  /** Id of the grant currently being changed, so only its buttons disable. */
  readonly busyId = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

  // Revoke is destructive and cascades, so it goes through a confirm step that
  // first shows what would be torn down.
  readonly revoking = signal<ConsentRow | null>(null);
  readonly revokeImpact = signal<ConsentImpact | null>(null);

  readonly rows = computed<ConsentRow[]>(() => {
    const grants = this.service.grants();
    return ALL_PURPOSES.map(purpose => {
      const grant = grants.find(g => g.purpose === purpose);
      const status = grant?.status ?? 'not_granted';
      return {
        purpose,
        ...CONSENT_PURPOSE_COPY[purpose],
        // Fall back to the canonical scopes so a patient who has not granted yet
        // still sees what they would be sharing before deciding.
        scopes: (grant?.dataScopes?.length ? grant.dataScopes : CONSENT_DEFAULT_SCOPES[purpose])
          .map(s => CONSENT_SCOPE_LABELS[s] ?? s),
        grant,
        status: consentStatusLabel(status),
        badge: status === 'active' ? 'success' : status === 'paused' ? 'warning' : 'neutral',
        canGrant: canGrant(status),
        canPause: canPause(status),
        canRevoke: canRevoke(status),
      };
    });
  });

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.service.load().subscribe({
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

  grant(row: ConsentRow): void {
    // No row yet for this purpose — create one. Otherwise flip the existing row on,
    // which is the path that was impossible before: a grant declined at onboarding.
    const request$ = row.grant
      ? this.service.transition(row.grant.id, 'active')
      : this.service.create(row.purpose, CONSENT_DEFAULT_SCOPES[row.purpose]);

    this.run(row.grant?.id ?? row.purpose, request$, 'Could not update this permission.');
  }

  pause(row: ConsentRow): void {
    if (!row.grant) return;
    this.run(row.grant.id, this.service.transition(row.grant.id, 'paused'), 'Could not pause sharing.');
  }

  /** Step 1 of revoking: load and show the impact before asking to confirm. */
  startRevoke(row: ConsentRow): void {
    if (!row.grant) return;
    this.actionError.set(null);
    this.revoking.set(row);
    this.revokeImpact.set(null);

    this.service.impact(row.grant.id).subscribe({
      next: impact => this.revokeImpact.set(impact),
      // A failed preview must not block the revoke — the patient can still proceed,
      // just without the detail of what it affects.
      error: () => this.revokeImpact.set(null),
    });
  }

  confirmRevoke(): void {
    const row = this.revoking();
    if (!row?.grant) return;

    this.busyId.set(row.grant.id);
    this.actionError.set(null);
    this.service.transition(row.grant.id, 'revoked').subscribe({
      next: () => {
        this.busyId.set(null);
        this.revoking.set(null);
      },
      error: (err: unknown) => {
        this.busyId.set(null);
        this.actionError.set(apiErrorMessage(err, 'Could not revoke this permission.'));
      },
    });
  }

  cancelRevoke(): void {
    this.revoking.set(null);
    this.revokeImpact.set(null);
  }

  get revokeMessage(): string {
    const impact = this.revokeImpact();
    const base = 'Revoking cannot be undone — you would need to grant it again from this screen.';
    if (!impact || impact.totalAffected === 0) return base;

    const parts: string[] = [];
    if (impact.affectedEnrollments.length) {
      parts.push(`${impact.affectedEnrollments.length} programme application(s)`);
    }
    if (impact.affectedStudyEnrollments.length) {
      parts.push(`${impact.affectedStudyEnrollments.length} study enrolment(s)`);
    }
    return `This will also end ${parts.join(' and ')}. ${base}`;
  }

  isBusy(row: ConsentRow): boolean {
    return this.busyId() === (row.grant?.id ?? row.purpose);
  }

  private run(key: string, request$: ReturnType<ConsentsService['transition']>, fallback: string): void {
    this.busyId.set(key);
    this.actionError.set(null);
    request$.subscribe({
      next: () => this.busyId.set(null),
      error: (err: unknown) => {
        this.busyId.set(null);
        this.actionError.set(apiErrorMessage(err, fallback));
      },
    });
  }
}
