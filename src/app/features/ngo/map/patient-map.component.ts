import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import {
  NIGERIA_ZONES,
  NigeriaZone,
  UNSPECIFIED_STATE,
  ZONE_COLORS,
  colorForState,
  zoneOf,
} from '../../../core/geo/nigeria';
import { NgoProgramsService, PatientMapRow } from '../../../core/programs/ngo-programs.service';

interface ZoneSummary {
  zone: string;
  total: number;
  color: string;
}

/**
 * Where this organisation's applicants are.
 *
 * The API returns counts per state and nothing else — patient location is not part of
 * the consented snapshot, so it never crosses the wire per person. Rows the backend
 * labels "Unspecified" are patients who onboarded before location was collected; they
 * are shown rather than hidden, so the totals still add up.
 */
@Component({
  selector: 'lc-patient-map',
  standalone: true,
  imports: [],
  templateUrl: './patient-map.component.html',
  styleUrl: './patient-map.component.scss',
})
export class PatientMapComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly programsSvc = inject(NgoProgramsService);

  readonly rows = signal<PatientMapRow[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);

  readonly totalSelected = computed(() => this.sum(r => r.selected));
  readonly totalInReview = computed(() => this.sum(r => r.inReview));
  readonly totalWaitlisted = computed(() => this.sum(r => r.waitlisted));

  /** Unspecified is not a place, so it does not count towards states reached. */
  readonly statesReached = computed(
    () => this.rows().filter(r => r.state !== UNSPECIFIED_STATE).length,
  );

  readonly zoneSummaries = computed<ZoneSummary[]>(() => {
    const totals = new Map<NigeriaZone, number>();
    for (const row of this.rows()) {
      const zone = zoneOf(row.state);
      if (!zone) continue;
      totals.set(zone, (totals.get(zone) ?? 0) + row.selected);
    }
    return NIGERIA_ZONES.filter(z => totals.has(z)).map(zone => ({
      zone,
      total: totals.get(zone) ?? 0,
      color: ZONE_COLORS[zone],
    }));
  });

  private readonly maxSelected = computed(() => Math.max(0, ...this.rows().map(r => r.selected)));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.auth
      .me()
      .pipe(
        switchMap(me => (me.orgId ? this.programsSvc.loadPatientMap(me.orgId) : of(null))),
        catchError(() => of(null)),
      )
      .subscribe(rows => {
        if (rows === null) {
          this.loadError.set(true);
          this.loading.set(false);
          return;
        }
        this.rows.set(rows);
        this.loadError.set(false);
        this.loading.set(false);
      });
  }

  zoneLabel(state: string): string {
    return zoneOf(state) ?? '—';
  }

  zoneColorForState(state: string): string {
    return colorForState(state);
  }

  /** Guarded: an organisation with no selections yet must render 0%, not NaN. */
  barWidth(selected: number): number {
    const max = this.maxSelected();
    return max > 0 ? Math.round((selected / max) * 100) : 0;
  }

  zoneShare(total: number): number {
    const all = this.totalSelected();
    return all > 0 ? Math.min(100, Math.round((total / all) * 100)) : 0;
  }

  private sum(pick: (row: PatientMapRow) => number): number {
    return this.rows().reduce((acc, row) => acc + pick(row), 0);
  }
}
