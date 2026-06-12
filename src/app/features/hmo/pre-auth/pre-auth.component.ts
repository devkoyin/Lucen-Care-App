import { Component, computed, signal } from '@angular/core';

export type PreAuthStatus = 'Pending' | 'Under Review' | 'Approved' | 'Rejected';

export interface PreAuthRequest {
  id: string;
  patient: string;
  initial: string;
  memberNumber: string;
  plan: string;
  procedure: string;
  icdCode: string;
  requestedBy: string;
  hospital: string;
  requestDate: string;
  status: PreAuthStatus;
  note?: string;
  reviewNote?: string;
}

const SEED: PreAuthRequest[] = [
  { id: 'PA-2026-0041', patient: 'Adaeze M.',  initial: 'A', memberNumber: 'HYG-2024-084721', plan: 'Comprehensive', procedure: 'Echocardiogram',          icdCode: 'I11.9',  requestedBy: 'Dr. James Obi',    hospital: 'Reddington Hospital', requestDate: '3 Jun 2026',  status: 'Pending',      note: 'Patient presenting with atypical chest pain; rule out structural abnormality.' },
  { id: 'PA-2026-0040', patient: 'Emeka O.',   initial: 'E', memberNumber: 'HYG-2023-039104', plan: 'Comprehensive', procedure: 'Physiotherapy × 10',       icdCode: 'M54.5',  requestedBy: 'Dr. Sarah Chen',   hospital: 'Lagoon Hospitals',    requestDate: '1 Jun 2026',  status: 'Under Review', note: 'Post-surgical rehabilitation following lumbar decompression.' },
  { id: 'PA-2026-0039', patient: 'Bisi L.',    initial: 'B', memberNumber: 'HYG-2022-017483', plan: 'Standard',      procedure: 'Upper GI Endoscopy',        icdCode: 'K21.0',  requestedBy: 'Dr. Amina Bello',  hospital: 'EKO Hospital',        requestDate: '3 Jun 2026',  status: 'Pending',      note: 'Persistent GERD symptoms unresponsive to PPI therapy for 8 weeks.' },
  { id: 'PA-2026-0038', patient: 'Tunde B.',   initial: 'T', memberNumber: 'HYG-2023-051620', plan: 'Comprehensive', procedure: 'MRI — Brain',               icdCode: 'R51',    requestedBy: 'Dr. Femi Adeyemi', hospital: 'St. Nicholas Hospital',requestDate: '29 May 2026', status: 'Approved',     reviewNote: 'Approved. Valid 60 days. Any accredited radiology centre.' },
  { id: 'PA-2026-0037', patient: 'Ngozi E.',   initial: 'N', memberNumber: 'HYG-2024-091337', plan: 'Standard',      procedure: 'Colonoscopy',               icdCode: 'K92.1',  requestedBy: 'Dr. Chioma Ike',   hospital: 'Lagoon Hospitals',    requestDate: '28 May 2026', status: 'Approved',     reviewNote: 'Approved. Recommended provider: Lagoon VI GI suite.' },
  { id: 'PA-2026-0036', patient: 'Fatima K.',  initial: 'F', memberNumber: 'HYG-2023-062841', plan: 'Basic',         procedure: 'Knee Arthroscopy',          icdCode: 'M23.2',  requestedBy: 'Dr. Yusuf Garba',  hospital: 'LASUTH',              requestDate: '25 May 2026', status: 'Rejected',     reviewNote: 'Rejected — Knee arthroscopy not covered under Basic Plan. Patient may upgrade plan or self-fund.' },
  { id: 'PA-2026-0035', patient: 'Chioma A.',  initial: 'C', memberNumber: 'HYG-2021-004419', plan: 'Comprehensive', procedure: 'Continuous Glucose Monitor', icdCode: 'E11.65', requestedBy: 'Dr. Amina Bello',  hospital: 'LUTH',                requestDate: '22 May 2026', status: 'Approved',     reviewNote: 'Approved for 3-month trial. Review at next HbA1c check.' },
];

type FilterTab = 'all' | PreAuthStatus;

@Component({
  selector: 'lc-pre-auth',
  standalone: true,
  imports: [],
  templateUrl: './pre-auth.component.html',
  styleUrl: './pre-auth.component.scss',
})
export class PreAuthComponent {
  readonly requests = signal<PreAuthRequest[]>(SEED);
  readonly activeFilter = signal<FilterTab>('all');
  readonly expandedId = signal<string | null>(null);

  readonly tabs: { label: string; key: FilterTab }[] = [
    { label: 'All',          key: 'all'          },
    { label: 'Pending',      key: 'Pending'      },
    { label: 'Under Review', key: 'Under Review' },
    { label: 'Approved',     key: 'Approved'     },
    { label: 'Rejected',     key: 'Rejected'     },
  ];

  readonly filtered = computed(() => {
    const f = this.activeFilter();
    return f === 'all' ? this.requests() : this.requests().filter(r => r.status === f);
  });

  readonly pendingCount = computed(() =>
    this.requests().filter(r => r.status === 'Pending' || r.status === 'Under Review').length
  );

  setFilter(f: FilterTab): void { this.activeFilter.set(f); }

  toggleExpand(id: string): void {
    this.expandedId.update(cur => cur === id ? null : id);
  }

  approve(id: string, e: MouseEvent): void {
    e.stopPropagation();
    this.requests.update(list =>
      list.map(r => r.id === id ? { ...r, status: 'Approved' as PreAuthStatus, reviewNote: 'Approved by reviewer. Valid 60 days.' } : r)
    );
  }

  reject(id: string, e: MouseEvent): void {
    e.stopPropagation();
    this.requests.update(list =>
      list.map(r => r.id === id ? { ...r, status: 'Rejected' as PreAuthStatus, reviewNote: 'Rejected by reviewer.' } : r)
    );
  }

  review(id: string, e: MouseEvent): void {
    e.stopPropagation();
    this.requests.update(list =>
      list.map(r => r.id === id ? { ...r, status: 'Under Review' as PreAuthStatus } : r)
    );
  }

  statusColor(s: PreAuthStatus): string {
    const map: Record<PreAuthStatus, string> = {
      'Pending':      '#D97706',
      'Under Review': '#2563EB',
      'Approved':     '#059669',
      'Rejected':     '#DC2626',
    };
    return map[s];
  }
}
