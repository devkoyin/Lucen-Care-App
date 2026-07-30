import { Component, computed, inject, signal } from '@angular/core';
import { NgoProgramsService, NgoProgram, ProgramStatus } from '../../../core/programs/ngo-programs.service';

type StatusFilter = 'all' | ProgramStatus;

@Component({
  selector: 'lc-programs',
  standalone: true,
  imports: [],
  templateUrl: './programs.component.html',
  styleUrl: './programs.component.scss',
})
export class ProgramsComponent {
  private readonly svc = inject(NgoProgramsService);

  readonly programs = this.svc.programs;
  readonly statusFilter = signal<StatusFilter>('all');
  readonly expandedId = signal<string | null>(null);

  readonly tabs: { label: string; key: StatusFilter }[] = [
    { label: 'All',     key: 'all'    },
    { label: 'Active',  key: 'Active' },
    { label: 'Closing', key: 'Closing'},
    { label: 'Full',    key: 'Full'   },
    { label: 'Paused',  key: 'Paused' },
  ];

  readonly filtered = computed(() => {
    const f = this.statusFilter();
    return f === 'all' ? this.programs() : this.programs().filter(p => p.status === f);
  });

  readonly totalBudget = computed(() =>
    this.programs().reduce((s, p) => s + p.budgetTotal, 0)
  );

  readonly totalDisbursed = computed(() =>
    this.programs().reduce((s, p) => s + p.budgetDisbursed, 0)
  );

  setFilter(f: StatusFilter): void { this.statusFilter.set(f); }
  toggleExpand(id: string): void { this.expandedId.update(c => c === id ? null : id); }

  pause(id: string): void { this.svc.setStatus(id, 'Paused'); }
  resume(id: string): void { this.svc.setStatus(id, 'Active'); }

  fillPercent(p: NgoProgram): number { return Math.round((p.slotsFilled / p.slotsTotal) * 100); }
  budgetPercent(p: NgoProgram): number { return Math.round((p.budgetDisbursed / p.budgetTotal) * 100); }

  formatAmount(n: number): string {
    return n >= 1000000
      ? '₦' + (n / 1000000).toFixed(1) + 'M'
      : '₦' + (n / 1000).toFixed(0) + 'K';
  }

  statusColor(s: ProgramStatus): string { return this.svc.statusColor(s); }

  fillColor(pct: number): string {
    return pct >= 90 ? '#DC2626' : pct >= 70 ? '#D97706' : '#059669';
  }
}
