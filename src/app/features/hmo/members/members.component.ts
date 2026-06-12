import { Component, computed, signal } from '@angular/core';

type MemberStatus = 'Active' | 'Suspended' | 'Flagged';

interface Member {
  id: string;
  name: string;
  initial: string;
  memberNumber: string;
  plan: string;
  planColor: string;
  employerGroup: string;
  conditions: string[];
  utilisationYTD: number;
  annualLimit: number;
  enrolledSince: string;
  status: MemberStatus;
}

const SEED: Member[] = [
  { id: 'm1', name: 'Chioma A.',  initial: 'C', memberNumber: 'HYG-2021-004419', plan: 'Comprehensive', planColor: '#2563EB', employerGroup: 'Dangote Group',   conditions: ['Diabetes'],                  utilisationYTD: 48200,  annualLimit: 2000000, enrolledSince: 'Apr 2021', status: 'Active'    },
  { id: 'm2', name: 'Emeka O.',   initial: 'E', memberNumber: 'HYG-2023-039104', plan: 'Comprehensive', planColor: '#2563EB', employerGroup: 'MTN Nigeria',      conditions: ['Hypertension'],              utilisationYTD: 71500,  annualLimit: 2000000, enrolledSince: 'Mar 2023', status: 'Active'    },
  { id: 'm3', name: 'Bisi L.',    initial: 'B', memberNumber: 'HYG-2022-017483', plan: 'Standard',      planColor: '#0D9488', employerGroup: 'NNPC',             conditions: ['Hypertension','High Chol.'], utilisationYTD: 39800,  annualLimit: 1000000, enrolledSince: 'Jun 2022', status: 'Active'    },
  { id: 'm4', name: 'Tunde B.',   initial: 'T', memberNumber: 'HYG-2023-051620', plan: 'Comprehensive', planColor: '#2563EB', employerGroup: 'GTBank',           conditions: ['Diabetes'],                  utilisationYTD: 22100,  annualLimit: 2000000, enrolledSince: 'Sep 2023', status: 'Active'    },
  { id: 'm5', name: 'Ngozi E.',   initial: 'N', memberNumber: 'HYG-2024-091337', plan: 'Standard',      planColor: '#0D9488', employerGroup: 'Access Bank',      conditions: ['Hypertension','Anxiety'],    utilisationYTD: 104700, annualLimit: 1000000, enrolledSince: 'Feb 2024', status: 'Flagged'   },
  { id: 'm6', name: 'Fatima K.',  initial: 'F', memberNumber: 'HYG-2023-062841', plan: 'Basic',         planColor: '#059669', employerGroup: 'Individual',       conditions: ['General Wellness'],          utilisationYTD: 8400,   annualLimit: 500000,  enrolledSince: 'Nov 2023', status: 'Active'    },
  { id: 'm7', name: 'Adaeze M.', initial: 'A', memberNumber: 'HYG-2024-084721', plan: 'Comprehensive', planColor: '#2563EB', employerGroup: 'Zenith Bank',       conditions: ['Hypertension','Diabetes'],   utilisationYTD: 61300,  annualLimit: 2000000, enrolledSince: 'Jan 2024', status: 'Active'    },
];

type PlanFilter = 'all' | 'Comprehensive' | 'Standard' | 'Basic';
type StatusFilter = 'all' | MemberStatus;

@Component({
  selector: 'lc-members',
  standalone: true,
  imports: [],
  templateUrl: './members.component.html',
  styleUrl: './members.component.scss',
})
export class MembersComponent {
  readonly members = signal<Member[]>(SEED);
  readonly planFilter   = signal<PlanFilter>('all');
  readonly statusFilter = signal<StatusFilter>('all');
  readonly searchQuery  = signal('');

  readonly planTabs: { label: string; key: PlanFilter }[] = [
    { label: 'All Plans',      key: 'all'           },
    { label: 'Comprehensive',  key: 'Comprehensive' },
    { label: 'Standard',       key: 'Standard'      },
    { label: 'Basic',          key: 'Basic'         },
  ];

  readonly filtered = computed(() => {
    let list = this.members();
    const plan   = this.planFilter();
    const status = this.statusFilter();
    const q      = this.searchQuery().toLowerCase();

    if (plan   !== 'all') list = list.filter(m => m.plan === plan);
    if (status !== 'all') list = list.filter(m => m.status === status);
    if (q) list = list.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.memberNumber.toLowerCase().includes(q) ||
      m.employerGroup.toLowerCase().includes(q)
    );
    return list;
  });

  readonly flaggedCount = computed(() => this.members().filter(m => m.status === 'Flagged').length);

  setPlanFilter(f: PlanFilter): void { this.planFilter.set(f); }
  setStatusFilter(f: StatusFilter): void { this.statusFilter.set(f); }
  setSearch(e: Event): void { this.searchQuery.set((e.target as HTMLInputElement).value); }

  flag(id: string): void {
    this.members.update(list =>
      list.map(m => m.id === id ? { ...m, status: (m.status === 'Flagged' ? 'Active' : 'Flagged') as MemberStatus } : m)
    );
  }

  utilisationPct(used: number, limit: number): number {
    return Math.min(Math.round((used / limit) * 100), 100);
  }

  utilisationColor(pct: number): string {
    if (pct >= 80) return '#DC2626';
    if (pct >= 50) return '#D97706';
    return '#059669';
  }

  formatAmount(n: number): string { return '₦' + n.toLocaleString('en-NG'); }

  statusColor(s: MemberStatus): string {
    return s === 'Active' ? '#059669' : s === 'Flagged' ? '#D97706' : '#DC2626';
  }
}
