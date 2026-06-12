import { Component, computed, signal } from '@angular/core';

export type ClaimStatus = 'Pending' | 'Approved' | 'Rejected' | 'Queried';

export interface Claim {
  id: string;
  hospital: string;
  patient: string;
  initial: string;
  plan: string;
  description: string;
  amount: number;
  submittedDate: string;
  status: ClaimStatus;
  preAuthId?: string;
  queryNote?: string;
}

const SEED: Claim[] = [
  { id: 'CLM-2026-8821', hospital: 'Reddington Hospital',  patient: 'Emeka O.',  initial: 'E', plan: 'Comprehensive', description: 'Cardiology consultation — Dr. James Obi',  amount: 35000, submittedDate: '14 May 2026', status: 'Pending',  preAuthId: 'PA-2026-0038' },
  { id: 'CLM-2026-8820', hospital: 'Lagoon Hospitals',     patient: 'Adaeze M.', initial: 'A', plan: 'Comprehensive', description: 'HbA1c blood test',                          amount: 12500, submittedDate: '2 May 2026',  status: 'Approved' },
  { id: 'CLM-2026-8819', hospital: 'EKO Hospital',         patient: 'Bisi L.',   initial: 'B', plan: 'Standard',      description: 'Lisinopril 10mg × 90 tabs',                 amount: 4800,  submittedDate: '28 May 2026', status: 'Approved' },
  { id: 'CLM-2026-8818', hospital: 'St. Nicholas Hospital',patient: 'Tunde B.',  initial: 'T', plan: 'Comprehensive', description: 'Atorvastatin 20mg × 30 tabs',               amount: 3200,  submittedDate: '18 Apr 2026', status: 'Approved' },
  { id: 'CLM-2026-8817', hospital: 'Lagoon Hospitals',     patient: 'Fatima K.', initial: 'F', plan: 'Basic',         description: 'Physiotherapy × 3 sessions',               amount: 22000, submittedDate: '5 Apr 2026',  status: 'Rejected', queryNote: 'No pre-authorisation on file for physiotherapy under Basic Plan.' },
  { id: 'CLM-2026-8816', hospital: 'LUTH',                 patient: 'Chioma A.', initial: 'C', plan: 'Comprehensive', description: 'Metformin 500mg × 90 tabs',                 amount: 8400,  submittedDate: '1 Apr 2026',  status: 'Queried',  queryNote: 'Invoice amount does not match tariff schedule. Please resubmit with itemised breakdown.' },
  { id: 'CLM-2026-8815', hospital: 'Reddington Hospital',  patient: 'Ngozi E.',  initial: 'N', plan: 'Standard',      description: 'Echocardiogram',                           amount: 85000, submittedDate: '22 Mar 2026', status: 'Approved', preAuthId: 'PA-2026-0037' },
  { id: 'CLM-2026-8814', hospital: 'Evercare Hospital',    patient: 'Adaeze M.', initial: 'A', plan: 'Comprehensive', description: 'GP consultation',                          amount: 15000, submittedDate: '10 Mar 2026', status: 'Approved' },
];

type FilterTab = 'all' | ClaimStatus;

@Component({
  selector: 'lc-claims',
  standalone: true,
  imports: [],
  templateUrl: './claims.component.html',
  styleUrl: './claims.component.scss',
})
export class ClaimsComponent {
  readonly claims = signal<Claim[]>(SEED);
  readonly activeFilter = signal<FilterTab>('all');
  readonly expandedId = signal<string | null>(null);

  readonly tabs: { label: string; key: FilterTab }[] = [
    { label: 'All',      key: 'all'      },
    { label: 'Pending',  key: 'Pending'  },
    { label: 'Queried',  key: 'Queried'  },
    { label: 'Approved', key: 'Approved' },
    { label: 'Rejected', key: 'Rejected' },
  ];

  readonly filtered = computed(() => {
    const f = this.activeFilter();
    return f === 'all' ? this.claims() : this.claims().filter(c => c.status === f);
  });

  readonly totalFiltered = computed(() =>
    this.filtered().reduce((s, c) => s + c.amount, 0)
  );

  readonly pendingCount = computed(() =>
    this.claims().filter(c => c.status === 'Pending' || c.status === 'Queried').length
  );

  setFilter(f: FilterTab): void { this.activeFilter.set(f); }

  toggleExpand(id: string): void {
    this.expandedId.update(cur => cur === id ? null : id);
  }

  approve(id: string, e: MouseEvent): void {
    e.stopPropagation();
    this.claims.update(list =>
      list.map(c => c.id === id ? { ...c, status: 'Approved' as ClaimStatus } : c)
    );
  }

  reject(id: string, e: MouseEvent): void {
    e.stopPropagation();
    this.claims.update(list =>
      list.map(c => c.id === id ? { ...c, status: 'Rejected' as ClaimStatus } : c)
    );
  }

  query(id: string, e: MouseEvent): void {
    e.stopPropagation();
    this.claims.update(list =>
      list.map(c => c.id === id ? { ...c, status: 'Queried' as ClaimStatus, queryNote: 'Additional documentation requested.' } : c)
    );
  }

  formatAmount(n: number): string { return '₦' + n.toLocaleString('en-NG'); }

  statusColor(s: ClaimStatus): string {
    const map: Record<ClaimStatus, string> = {
      Pending:  '#D97706',
      Approved: '#059669',
      Rejected: '#DC2626',
      Queried:  '#2563EB',
    };
    return map[s];
  }
}
