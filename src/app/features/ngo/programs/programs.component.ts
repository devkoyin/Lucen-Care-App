import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';

import { apiErrorMessage } from '../../../core/api/wrapped-response.model';
import { AuthService } from '../../../core/auth/auth.service';
import {
  NgoProgram,
  NgoProgramsService,
  ProgramLifecycle,
  toNaira,
} from '../../../core/programs/ngo-programs.service';

type StatusFilter = 'all' | ProgramLifecycle;

/** Filter tabs mirror the derived lifecycle, not the platform review state. */
const TABS: { label: string; key: StatusFilter }[] = [
  { label: 'All',     key: 'all' },
  { label: 'Active',  key: 'Active' },
  { label: 'Closing', key: 'Closing' },
  { label: 'Full',    key: 'Full' },
  { label: 'Paused',  key: 'Paused' },
  { label: 'Draft',   key: 'Draft' },
];

const LIFECYCLE_COLOR: Record<ProgramLifecycle, string> = {
  Active:  '#059669',
  Closing: '#D97706',
  Full:    '#2563EB',
  Paused:  '#6B7280',
  Draft:   '#7C3AED',
  Expired: '#991B1B',
};

@Component({
  selector: 'lc-programs',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './programs.component.html',
  styleUrl: './programs.component.scss',
})
export class ProgramsComponent implements OnInit {
  private readonly svc = inject(NgoProgramsService);
  private readonly auth = inject(AuthService);

  readonly programs = this.svc.programs;
  readonly tabs = TABS;
  readonly statusFilter = signal<StatusFilter>('all');
  readonly expandedId = signal<string | null>(null);

  readonly loading = signal(true);
  readonly loadError = signal(false);
  /** Programme currently being paused/resumed, so only its buttons disable. */
  readonly busyId = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

  readonly filtered = computed(() => {
    const f = this.statusFilter();
    return f === 'all' ? this.programs() : this.programs().filter(p => p.lifecycle === f);
  });

  // Naira, converted once from the kobo the API returns.
  readonly totalBudget = computed(() =>
    this.programs().reduce((s, p) => s + toNaira(p.budgetTotal), 0),
  );

  readonly totalDisbursed = computed(() =>
    this.programs().reduce((s, p) => s + toNaira(p.budgetDisbursed), 0),
  );

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    // orgId lives on /auth/me, not in the token payload the client can read.
    this.auth
      .me()
      .pipe(
        switchMap(me => (me.orgId ? this.svc.load(me.orgId) : of(null))),
        catchError(() => of(null)),
      )
      .subscribe(result => {
        this.loadError.set(result === null);
        this.loading.set(false);
      });
  }

  setFilter(f: StatusFilter): void {
    this.statusFilter.set(f);
  }

  toggleExpand(id: string): void {
    this.expandedId.update(c => (c === id ? null : id));
  }

  /** Pause and Resume previously had no (click) at all — the handlers were dead code. */
  setPaused(program: NgoProgram, paused: boolean): void {
    if (this.busyId()) return;

    this.busyId.set(program.id);
    this.actionError.set(null);
    this.svc.setPaused(program.id, paused).subscribe({
      next: () => this.busyId.set(null),
      error: (err: unknown) => {
        this.busyId.set(null);
        this.actionError.set(
          apiErrorMessage(err, `Could not ${paused ? 'pause' : 'resume'} this programme.`),
        );
      },
    });
  }

  isBusy(program: NgoProgram): boolean {
    return this.busyId() === program.id;
  }

  fillPercent(p: NgoProgram): number {
    return this.svc.fillPercent(p);
  }

  budgetPercent(p: NgoProgram): number {
    return this.svc.budgetPercent(p);
  }

  /** Naira in, formatted out. Handles sub-1000 amounts, which the old one did not. */
  formatAmount(naira: number): string {
    if (naira >= 1_000_000) return `₦${(naira / 1_000_000).toFixed(1)}M`;
    if (naira >= 1_000) return `₦${(naira / 1_000).toFixed(0)}K`;
    return `₦${naira.toFixed(0)}`;
  }

  budgetLabel(p: NgoProgram): string {
    if (!p.budgetTotal) return 'Not set';
    return `${this.formatAmount(toNaira(p.budgetDisbursed))} of ${this.formatAmount(toNaira(p.budgetTotal))}`;
  }

  slotsLabel(p: NgoProgram): string {
    if (!p.slotsTotal) return 'Unlimited';
    return `${p.slotsFilled} of ${p.slotsTotal}`;
  }

  lifecycleColor(l: ProgramLifecycle): string {
    return LIFECYCLE_COLOR[l] ?? '#6B7280';
  }

  fillColor(pct: number): string {
    return pct >= 90 ? '#DC2626' : pct >= 70 ? '#D97706' : '#059669';
  }
}
