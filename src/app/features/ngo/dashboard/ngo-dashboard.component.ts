import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import {
  Applicant,
  ApplicantsService,
  EnrollmentStatus,
  applicantStatusLabel,
} from '../../../core/programs/applicants.service';
import { NgoProgram, NgoProgramsService } from '../../../core/programs/ngo-programs.service';

interface StatCard {
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
}

/** One row of the Recent Applicants panel, flattened across programmes. */
interface RecentApplicant {
  id: string;
  name: string;
  condition: string;
  programTitle: string;
  status: EnrollmentStatus;
  createdAt: string;
}

/** How many programmes' queues the recent list samples — one request each. */
const RECENT_PROGRAM_SAMPLE = 5;
const RECENT_ROWS = 6;

@Component({
  selector: 'lc-ngo-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './ngo-dashboard.component.html',
  styleUrl: './ngo-dashboard.component.scss',
})
export class NgoDashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly programsSvc = inject(NgoProgramsService);
  private readonly applicantsSvc = inject(ApplicantsService);

  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly programs = this.programsSvc.programs;
  readonly recent = signal<RecentApplicant[]>([]);

  get orgName(): string {
    return this.auth.user()?.name ?? 'your organisation';
  }

  readonly stats = computed<StatCard[]>(() => {
    const s = this.programsSvc.stats();
    if (!s) return [];
    return [
      { label: 'Active Programs', value: s.activePrograms, hint: `${s.totalPrograms} in total` },
      { label: 'Total Applicants', value: s.totalApplicants },
      { label: 'Selected Patients', value: s.selectedPatients },
      { label: 'Pending Review', value: s.pendingReview, accent: true },
    ];
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.auth
      .me()
      .pipe(
        switchMap(me =>
          me.orgId
            ? forkJoin([this.programsSvc.loadStats(me.orgId), this.programsSvc.load(me.orgId)])
            : of(null),
        ),
        catchError(() => of(null)),
      )
      .subscribe(result => {
        if (result === null) {
          this.loadError.set(true);
          this.loading.set(false);
          return;
        }
        this.loadError.set(false);
        this.loading.set(false);
        this.loadRecentApplicants();
      });
  }

  /**
   * The applicant queue is per-programme, so "recent across the org" means sampling
   * the newest programmes rather than one call. Bounded deliberately — a chatty
   * dashboard is worse than a slightly shorter list.
   */
  private loadRecentApplicants(): void {
    const sample = this.programs().slice(0, RECENT_PROGRAM_SAMPLE);
    if (sample.length === 0) {
      this.recent.set([]);
      return;
    }

    forkJoin(
      sample.map(p =>
        this.applicantsSvc
          .load(p.id, 20)
          // One failing programme must not blank the whole panel.
          .pipe(catchError(() => of([] as Applicant[]))),
      ),
    ).subscribe(results => {
      const rows: RecentApplicant[] = results.flatMap((applicants, i) =>
        applicants.map(a => ({
          id: a.id,
          name: a.sharedDataSnapshot.name || 'Unnamed applicant',
          condition: (a.sharedDataSnapshot.conditionTags ?? [])[0] ?? '—',
          programTitle: sample[i].title,
          status: a.status,
          createdAt: a.createdAt,
        })),
      );

      // ULIDs and ISO timestamps both sort lexicographically; newest first.
      rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      this.recent.set(rows.slice(0, RECENT_ROWS));
    });
  }

  statusLabel(status: EnrollmentStatus): string {
    return applicantStatusLabel(status);
  }

  /** Guarded inside the service: an uncapped programme renders 0%, never NaN. */
  fillPercent(p: NgoProgram): number {
    return this.programsSvc.fillPercent(p);
  }
}
