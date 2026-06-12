import { Component, computed, signal } from '@angular/core';

type ProviderStatus = 'Active' | 'Under Review' | 'Suspended';

interface Provider {
  id: string;
  name: string;
  type: string;
  area: string;
  city: string;
  plans: string[];
  claimsMTD: number;
  claimsCount: number;
  accreditedSince: string;
  status: ProviderStatus;
  contactName: string;
  contactPhone: string;
}

const SEED: Provider[] = [
  { id: 'pr1', name: 'Reddington Hospital',      type: 'Private Hospital',   area: 'Victoria Island', city: 'Lagos', plans: ['Comprehensive','Standard','Basic'], claimsMTD: 12400000, claimsCount: 48, accreditedSince: 'Jan 2019', status: 'Active',       contactName: 'Mrs. Adaku Eze',    contactPhone: '+234 1 280 0000' },
  { id: 'pr2', name: 'Lagoon Hospitals (VI)',     type: 'Private Hospital',   area: 'Victoria Island', city: 'Lagos', plans: ['Comprehensive','Standard','Basic'], claimsMTD: 9800000,  claimsCount: 41, accreditedSince: 'Mar 2018', status: 'Active',       contactName: 'Mr. Seun Adeyemi',  contactPhone: '+234 1 270 0000' },
  { id: 'pr3', name: 'Evercare Hospital',         type: 'Private Hospital',   area: 'Lekki',           city: 'Lagos', plans: ['Comprehensive'],                   claimsMTD: 6700000,  claimsCount: 22, accreditedSince: 'Jun 2021', status: 'Active',       contactName: 'Dr. Kemi Balogun',  contactPhone: '+234 1 453 0000' },
  { id: 'pr4', name: 'EKO Hospital',              type: 'Private Hospital',   area: 'Ikeja',           city: 'Lagos', plans: ['Comprehensive','Standard'],        claimsMTD: 7200000,  claimsCount: 35, accreditedSince: 'Aug 2017', status: 'Active',       contactName: 'Mrs. Ngozi Okafor', contactPhone: '+234 1 493 0000' },
  { id: 'pr5', name: 'St. Nicholas Hospital',     type: 'Private Hospital',   area: 'Lagos Island',    city: 'Lagos', plans: ['Comprehensive'],                   claimsMTD: 5100000,  claimsCount: 19, accreditedSince: 'Feb 2020', status: 'Active',       contactName: 'Mr. Tobi Faleye',   contactPhone: '+234 1 263 0000' },
  { id: 'pr6', name: 'LASUTH',                    type: 'Teaching Hospital',  area: 'Ikeja',           city: 'Lagos', plans: ['Basic'],                           claimsMTD: 3800000,  claimsCount: 31, accreditedSince: 'Jan 2016', status: 'Active',       contactName: 'Dr. Amara Igwe',    contactPhone: '+234 1 497 0000' },
  { id: 'pr7', name: 'LUTH',                      type: 'Teaching Hospital',  area: 'Idi-Araba',       city: 'Lagos', plans: ['Basic'],                           claimsMTD: 2900000,  claimsCount: 27, accreditedSince: 'Jan 2016', status: 'Active',       contactName: 'Dr. Funke Oladipo', contactPhone: '+234 1 774 0000' },
  { id: 'pr8', name: 'Eko Hospitals (Surulere)', type: 'Private Hospital',   area: 'Surulere',        city: 'Lagos', plans: ['Standard','Basic'],                claimsMTD: 1200000,  claimsCount: 11, accreditedSince: 'May 2022', status: 'Under Review', contactName: 'Mrs. Bisi Lawal',   contactPhone: '+234 1 773 0000' },
];

type StatusFilter = 'all' | ProviderStatus;

@Component({
  selector: 'lc-providers',
  standalone: true,
  imports: [],
  templateUrl: './providers.component.html',
  styleUrl: './providers.component.scss',
})
export class ProvidersComponent {
  readonly providers   = signal<Provider[]>(SEED);
  readonly statusFilter = signal<StatusFilter>('all');
  readonly expandedId  = signal<string | null>(null);
  readonly searchQuery = signal('');

  readonly statusTabs: { label: string; key: StatusFilter }[] = [
    { label: 'All',          key: 'all'           },
    { label: 'Active',       key: 'Active'        },
    { label: 'Under Review', key: 'Under Review'  },
    { label: 'Suspended',    key: 'Suspended'     },
  ];

  readonly filtered = computed(() => {
    let list = this.providers();
    const s = this.statusFilter();
    const q = this.searchQuery().toLowerCase();
    if (s !== 'all') list = list.filter(p => p.status === s);
    if (q) list = list.filter(p =>
      p.name.toLowerCase().includes(q) || p.area.toLowerCase().includes(q)
    );
    return list;
  });

  readonly totalMTD = computed(() =>
    this.filtered().reduce((s, p) => s + p.claimsMTD, 0)
  );

  setStatusFilter(f: StatusFilter): void { this.statusFilter.set(f); }
  setSearch(e: Event): void { this.searchQuery.set((e.target as HTMLInputElement).value); }
  toggleExpand(id: string): void { this.expandedId.update(c => c === id ? null : id); }

  suspend(id: string, e: MouseEvent): void {
    e.stopPropagation();
    this.providers.update(list =>
      list.map(p => p.id === id ? { ...p, status: 'Suspended' as ProviderStatus } : p)
    );
  }

  activate(id: string, e: MouseEvent): void {
    e.stopPropagation();
    this.providers.update(list =>
      list.map(p => p.id === id ? { ...p, status: 'Active' as ProviderStatus } : p)
    );
  }

  formatAmount(n: number): string {
    return n >= 1000000
      ? '₦' + (n / 1000000).toFixed(1) + 'M'
      : '₦' + (n / 1000).toFixed(0) + 'K';
  }

  statusColor(s: ProviderStatus): string {
    return s === 'Active' ? '#059669' : s === 'Under Review' ? '#2563EB' : '#DC2626';
  }
}
