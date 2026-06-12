import { Component, computed, signal } from '@angular/core';

type ProgramStatus = 'Active' | 'Closing' | 'Full' | 'Paused';

interface Program {
  id: string;
  name: string;
  focus: string;
  description: string;
  eligibility: string;
  budgetTotal: number;
  budgetDisbursed: number;
  slotsTotal: number;
  slotsFilled: number;
  status: ProgramStatus;
  deadline: string;
  donor: string;
  coordinator: string;
}

const SEED: Program[] = [
  {
    id: 'PRG-001',
    name: 'Chronic Care Fund',
    focus: 'Diabetes · Hypertension',
    description: 'Subsidised medication and quarterly specialist consultations for low-income adults managing Type 2 Diabetes or hypertension across Lagos and Abuja.',
    eligibility: 'Confirmed diagnosis, monthly household income ≤ ₦80,000, Nigerian citizen aged 18+.',
    budgetTotal:    18500000,
    budgetDisbursed: 11200000,
    slotsTotal:  50,
    slotsFilled: 34,
    status: 'Active',
    deadline: '31 Aug 2026',
    donor: 'Bill & Melinda Gates Foundation',
    coordinator: 'Dr. Amina Bello',
  },
  {
    id: 'PRG-002',
    name: 'Cardiac Support Program',
    focus: 'Heart Disease · Post-surgical Rehab',
    description: 'Covers diagnostic procedures (ECG, Echo), medication, and physiotherapy for patients with confirmed coronary artery disease or post-cardiac surgery.',
    eligibility: 'Cardiologist referral required. Income-verified. Prioritised by clinical urgency score.',
    budgetTotal:    12000000,
    budgetDisbursed: 10800000,
    slotsTotal:  25,
    slotsFilled: 22,
    status: 'Closing',
    deadline: '30 Jun 2026',
    donor: 'Tony Elumelu Foundation',
    coordinator: 'Mrs. Ngozi Okafor',
  },
  {
    id: 'PRG-003',
    name: 'Respiratory Aid Initiative',
    focus: 'Asthma · COPD',
    description: 'Provides inhalers, nebulisers, and twice-yearly pulmonology visits for adults and children with chronic respiratory conditions in urban areas.',
    eligibility: 'Spirometry-confirmed diagnosis. Ages 6–65. Residents of Lagos, Kano, or Port Harcourt.',
    budgetTotal:     9200000,
    budgetDisbursed:  3100000,
    slotsTotal:  40,
    slotsFilled: 18,
    status: 'Active',
    deadline: '31 Dec 2026',
    donor: 'GlaxoSmithKline Nigeria CSR',
    coordinator: 'Mr. Seun Adeyemi',
  },
  {
    id: 'PRG-004',
    name: 'Child Nutrition Fund',
    focus: 'Malnutrition · Under-5 Health',
    description: 'Therapeutic feeding support, vitamin supplementation, and monthly paediatric reviews for children under 5 with moderate to severe acute malnutrition.',
    eligibility: 'Confirmed SAM/MAM by MUAC screening. Children aged 6 months to 5 years.',
    budgetTotal:     6800000,
    budgetDisbursed:  6800000,
    slotsTotal:  15,
    slotsFilled: 15,
    status: 'Full',
    deadline: 'Closed',
    donor: 'UNICEF Nigeria',
    coordinator: 'Dr. Kemi Balogun',
  },
  {
    id: 'PRG-005',
    name: 'Sickle Cell Support Fund',
    focus: 'Sickle Cell Disease',
    description: 'Covers hydroxyurea prescriptions, annual transcranial doppler screening, and crisis hospitalisation top-ups for patients with HbSS or HbSC genotype.',
    eligibility: 'Genotype confirmation (HbSS or HbSC). All ages. Financial hardship assessment required.',
    budgetTotal:    11000000,
    budgetDisbursed:  2900000,
    slotsTotal:  20,
    slotsFilled:  8,
    status: 'Active',
    deadline: '31 Oct 2026',
    donor: 'Sickle Cell Association of Nigeria',
    coordinator: 'Dr. Funke Oladipo',
  },
  {
    id: 'PRG-006',
    name: 'Maternal Health Initiative',
    focus: 'Prenatal Care · Safe Delivery',
    description: 'Free antenatal visits, iron/folic acid supplementation, and subsidised facility delivery for low-income pregnant women in underserved communities.',
    eligibility: 'Confirmed pregnancy before 20 weeks gestation. Household income ≤ ₦60,000/month.',
    budgetTotal:     8400000,
    budgetDisbursed:  3200000,
    slotsTotal:  30,
    slotsFilled: 12,
    status: 'Active',
    deadline: '31 Mar 2027',
    donor: 'USAID Nigeria',
    coordinator: 'Mrs. Bisi Lawal',
  },
];

type StatusFilter = 'all' | ProgramStatus;

@Component({
  selector: 'lc-programs',
  standalone: true,
  imports: [],
  templateUrl: './programs.component.html',
  styleUrl: './programs.component.scss',
})
export class ProgramsComponent {
  readonly programs = signal<Program[]>(SEED);
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

  fillPercent(p: Program): number { return Math.round((p.slotsFilled / p.slotsTotal) * 100); }

  budgetPercent(p: Program): number { return Math.round((p.budgetDisbursed / p.budgetTotal) * 100); }

  formatAmount(n: number): string {
    return n >= 1000000
      ? '₦' + (n / 1000000).toFixed(1) + 'M'
      : '₦' + (n / 1000).toFixed(0) + 'K';
  }

  statusColor(s: ProgramStatus): string {
    const map: Record<ProgramStatus, string> = {
      Active:  '#059669',
      Closing: '#D97706',
      Full:    '#2563EB',
      Paused:  '#6B7280',
    };
    return map[s];
  }

  fillColor(pct: number): string {
    return pct >= 90 ? '#DC2626' : pct >= 70 ? '#D97706' : '#059669';
  }
}
