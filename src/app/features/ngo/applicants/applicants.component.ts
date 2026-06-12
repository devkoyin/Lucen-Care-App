import { Component, computed, signal } from '@angular/core';

export type AppStatus = 'New' | 'In Review' | 'Selected' | 'Waitlisted' | 'Rejected';

export interface Applicant {
  id: string;
  name: string;
  initial: string;
  age: number;
  gender: 'M' | 'F';
  state: string;
  condition: string;
  programId: string;
  programName: string;
  appliedDate: string;
  status: AppStatus;
  monthlyCost: number;
  note?: string;
}

const SEED: Applicant[] = [
  { id: 'APP-0087', name: 'Fatima Yusuf',       initial: 'F', age: 42, gender: 'F', state: 'Kano',    condition: 'Type 2 Diabetes',     programId: 'PRG-001', programName: 'Chronic Care Fund',         appliedDate: '3 Jun 2026',  status: 'New',        monthlyCost: 18500 },
  { id: 'APP-0086', name: 'Emmanuel Okafor',     initial: 'E', age: 58, gender: 'M', state: 'Lagos',   condition: 'Hypertension',        programId: 'PRG-001', programName: 'Chronic Care Fund',         appliedDate: '1 Jun 2026',  status: 'In Review',  monthlyCost: 12000 },
  { id: 'APP-0085', name: 'Kwame Asante',        initial: 'K', age: 24, gender: 'M', state: 'Abuja',   condition: 'Sickle Cell Disease', programId: 'PRG-005', programName: 'Sickle Cell Support Fund',  appliedDate: '31 May 2026', status: 'New',        monthlyCost: 32000, note: 'HbSS genotype confirmed. Two crisis admissions in the last 12 months.' },
  { id: 'APP-0084', name: 'Amara Diallo',        initial: 'A', age: 3,  gender: 'F', state: 'Kaduna',  condition: 'Severe Acute Malnutrition', programId: 'PRG-004', programName: 'Child Nutrition Fund', appliedDate: '30 May 2026', status: 'Waitlisted', monthlyCost: 8200 },
  { id: 'APP-0083', name: 'Chidinma Obi',        initial: 'C', age: 31, gender: 'F', state: 'Enugu',   condition: 'Asthma',              programId: 'PRG-003', programName: 'Respiratory Aid Initiative',appliedDate: '28 May 2026', status: 'In Review',  monthlyCost: 9500 },
  { id: 'APP-0082', name: 'Musa Ibrahim',        initial: 'M', age: 67, gender: 'M', state: 'Kano',    condition: 'Coronary Artery Disease', programId: 'PRG-002', programName: 'Cardiac Support Program', appliedDate: '25 May 2026', status: 'Selected',   monthlyCost: 45000, note: 'Referred by Dr. Garba Musa, ABUTH. Post-CABG rehab required.' },
  { id: 'APP-0081', name: 'Ngozi Eze',           initial: 'N', age: 28, gender: 'F', state: 'Rivers',  condition: 'Gestational Diabetes', programId: 'PRG-001', programName: 'Chronic Care Fund',        appliedDate: '22 May 2026', status: 'Selected',   monthlyCost: 14000 },
  { id: 'APP-0080', name: 'Adebayo Afolabi',     initial: 'A', age: 52, gender: 'M', state: 'Oyo',     condition: 'COPD',                programId: 'PRG-003', programName: 'Respiratory Aid Initiative', appliedDate: '20 May 2026', status: 'Selected',   monthlyCost: 11500 },
  { id: 'APP-0079', name: 'Blessing Nwachukwu',  initial: 'B', age: 26, gender: 'F', state: 'Imo',     condition: 'Hypertension',        programId: 'PRG-001', programName: 'Chronic Care Fund',         appliedDate: '15 May 2026', status: 'Rejected',   monthlyCost: 10000, note: 'Household income assessment above threshold (₦120,000/month).' },
  { id: 'APP-0078', name: 'Taiwo Adeleke',       initial: 'T', age: 45, gender: 'M', state: 'Osun',    condition: 'Heart Failure',       programId: 'PRG-002', programName: 'Cardiac Support Program',   appliedDate: '10 May 2026', status: 'Selected',   monthlyCost: 38000 },
  { id: 'APP-0077', name: 'Halima Abdullahi',    initial: 'H', age: 22, gender: 'F', state: 'Bauchi',  condition: 'Sickle Cell Disease', programId: 'PRG-005', programName: 'Sickle Cell Support Fund',  appliedDate: '5 May 2026',  status: 'In Review',  monthlyCost: 28000, note: 'HbSS confirmed. Enrolled in UATH transfusion program.' },
  { id: 'APP-0076', name: 'Emeka Nwosu',         initial: 'E', age: 7,  gender: 'M', state: 'Anambra', condition: 'Moderate Malnutrition', programId: 'PRG-004', programName: 'Child Nutrition Fund',   appliedDate: '1 May 2026',  status: 'Waitlisted', monthlyCost: 7000 },
  { id: 'APP-0075', name: 'Aisha Mohammed',      initial: 'A', age: 34, gender: 'F', state: 'Abuja',   condition: 'Pre-eclampsia risk',  programId: 'PRG-006', programName: 'Maternal Health Initiative', appliedDate: '28 Apr 2026', status: 'Selected',   monthlyCost: 16000 },
  { id: 'APP-0074', name: 'Olumide Johnson',     initial: 'O', age: 60, gender: 'M', state: 'Lagos',   condition: 'Type 2 Diabetes',     programId: 'PRG-001', programName: 'Chronic Care Fund',         appliedDate: '20 Apr 2026', status: 'Rejected',   monthlyCost: 22000, note: 'Ineligible — duplicate application detected. Referred to partner NGO.' },
];

type StatusFilter = 'all' | AppStatus;

@Component({
  selector: 'lc-applicants',
  standalone: true,
  imports: [],
  templateUrl: './applicants.component.html',
  styleUrl: './applicants.component.scss',
})
export class ApplicantsComponent {
  readonly applicants = signal<Applicant[]>(SEED);
  readonly statusFilter = signal<StatusFilter>('all');
  readonly programFilter = signal<string>('all');
  readonly searchQuery = signal('');

  readonly statusTabs: { label: string; key: StatusFilter }[] = [
    { label: 'All',         key: 'all'        },
    { label: 'New',         key: 'New'        },
    { label: 'In Review',   key: 'In Review'  },
    { label: 'Selected',    key: 'Selected'   },
    { label: 'Waitlisted',  key: 'Waitlisted' },
    { label: 'Rejected',    key: 'Rejected'   },
  ];

  readonly programOptions: { label: string; value: string }[] = [
    { label: 'All Programs',               value: 'all'    },
    { label: 'Chronic Care Fund',          value: 'PRG-001'},
    { label: 'Cardiac Support Program',    value: 'PRG-002'},
    { label: 'Respiratory Aid Initiative', value: 'PRG-003'},
    { label: 'Child Nutrition Fund',       value: 'PRG-004'},
    { label: 'Sickle Cell Support Fund',   value: 'PRG-005'},
    { label: 'Maternal Health Initiative', value: 'PRG-006'},
  ];

  readonly filtered = computed(() => {
    let list = this.applicants();
    const s = this.statusFilter();
    const p = this.programFilter();
    const q = this.searchQuery().toLowerCase();
    if (s !== 'all') list = list.filter(a => a.status === s);
    if (p !== 'all') list = list.filter(a => a.programId === p);
    if (q) list = list.filter(a =>
      a.name.toLowerCase().includes(q) || a.condition.toLowerCase().includes(q)
    );
    return list;
  });

  readonly pendingCount = computed(() =>
    this.applicants().filter(a => a.status === 'New' || a.status === 'In Review').length
  );

  setStatus(f: StatusFilter): void { this.statusFilter.set(f); }
  setProgram(e: Event): void { this.programFilter.set((e.target as HTMLSelectElement).value); }
  setSearch(e: Event): void { this.searchQuery.set((e.target as HTMLInputElement).value); }

  select(id: string): void {
    this.applicants.update(list =>
      list.map(a => a.id === id ? { ...a, status: 'Selected' as AppStatus } : a)
    );
  }

  waitlist(id: string): void {
    this.applicants.update(list =>
      list.map(a => a.id === id ? { ...a, status: 'Waitlisted' as AppStatus } : a)
    );
  }

  reject(id: string): void {
    this.applicants.update(list =>
      list.map(a => a.id === id ? { ...a, status: 'Rejected' as AppStatus } : a)
    );
  }

  review(id: string): void {
    this.applicants.update(list =>
      list.map(a => a.id === id ? { ...a, status: 'In Review' as AppStatus } : a)
    );
  }

  formatAmount(n: number): string {
    return '₦' + n.toLocaleString('en-NG');
  }

  statusColor(s: AppStatus): string {
    const map: Record<AppStatus, string> = {
      'New':        '#2563EB',
      'In Review':  '#D97706',
      'Selected':   '#059669',
      'Waitlisted': '#7C3AED',
      'Rejected':   '#DC2626',
    };
    return map[s];
  }
}
