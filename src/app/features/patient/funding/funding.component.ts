import { Component, computed, signal } from '@angular/core';

type ClaimStatus  = 'Approved' | 'Pending' | 'Rejected';
type PreAuthStatus = 'Approved' | 'Under Review' | 'Pending';
type PlanType = 'HMO' | 'Government' | 'NGO';

interface CoveragePlan {
  id: string;
  name: string;
  provider: string;
  type: PlanType;
  typeColor: string;
  memberNumber: string;
  renewalDate: string;
  coverageItems: { label: string; value: string }[];
}

interface PreAuthRequest {
  id: string;
  procedure: string;
  requestedBy: string;
  requestDate: string;
  plan: string;
  status: PreAuthStatus;
  note?: string;
}

interface AssistanceProgram {
  id: string;
  name: string;
  org: string;
  orgType: 'NGO' | 'Pharma' | 'Government';
  orgColor: string;
  description: string;
  covers: string;
  eligibility: string;
  enrolled: boolean;
}

interface ProviderClaim {
  id: string;
  description: string;
  date: string;
  amount: number;
  plan: string;
  status: ClaimStatus;
}

interface NetworkProvider {
  id: string;
  name: string;
  type: string;
  area: string;
  plans: string[];
  distance: string;
}

const PLANS: CoveragePlan[] = [
  {
    id: 'p1',
    name: 'Comprehensive Care Plan',
    provider: 'Hygeia HMO',
    type: 'HMO',
    typeColor: '#2563EB',
    memberNumber: 'HYG-2024-084721',
    renewalDate: 'Dec 2026',
    coverageItems: [
      { label: 'GP Consultations',   value: '100% covered' },
      { label: 'Specialist Visits',  value: '80% covered'  },
      { label: 'Prescription Drugs', value: '70% covered'  },
      { label: 'Lab & Diagnostics',  value: '75% covered'  },
      { label: 'Annual limit',       value: '₦2,000,000'   },
    ],
  },
  {
    id: 'p2',
    name: 'Basic Plus Scheme',
    provider: 'NHIS',
    type: 'Government',
    typeColor: '#059669',
    memberNumber: 'NHIS-LGS-39182',
    renewalDate: 'Mar 2027',
    coverageItems: [
      { label: 'Primary Care',       value: 'Fully covered' },
      { label: 'Generic Medicines',  value: 'Fully covered' },
      { label: 'Specialist Visits',  value: '50% covered'   },
      { label: 'Annual limit',       value: '₦500,000'      },
    ],
  },
];

const PRE_AUTHS: PreAuthRequest[] = [
  {
    id: 'pa1',
    procedure: 'Echocardiogram',
    requestedBy: 'Dr. James Obi',
    requestDate: '20 May 2026',
    plan: 'Hygeia HMO',
    status: 'Approved',
    note: 'Valid for 60 days. Book at any accredited cardiac centre.',
  },
  {
    id: 'pa2',
    procedure: 'Physiotherapy — 10 sessions',
    requestedBy: 'Dr. Sarah Chen',
    requestDate: '1 Jun 2026',
    plan: 'Hygeia HMO',
    status: 'Under Review',
  },
  {
    id: 'pa3',
    procedure: 'Upper GI Endoscopy',
    requestedBy: 'Dr. Amina Bello',
    requestDate: '3 Jun 2026',
    plan: 'Hygeia HMO',
    status: 'Pending',
    note: 'Awaiting receipt of referral letter from your GP.',
  },
];

const PROGRAMS: AssistanceProgram[] = [
  {
    id: 'a1',
    name: 'Access to Diabetes Medicines',
    org: 'Access to Medicines Foundation',
    orgType: 'NGO',
    orgColor: '#F59E0B',
    description: 'Subsidised or free Metformin and insulin for qualifying patients with type 2 diabetes who demonstrate financial need.',
    covers: 'Metformin, Insulin, Glucometer strips',
    eligibility: 'Type 2 diabetes diagnosis + income below ₦150,000/month',
    enrolled: true,
  },
  {
    id: 'a2',
    name: 'Heart Health Initiative Nigeria',
    org: 'Cardiac Care NGO',
    orgType: 'NGO',
    orgColor: '#DC2626',
    description: 'Subsidised cardiology consultations and echocardiograms for patients managing hypertension or heart disease.',
    covers: 'Cardiology consultations, ECG, Echo',
    eligibility: 'Hypertension or cardiac diagnosis; open enrolment',
    enrolled: false,
  },
  {
    id: 'a3',
    name: 'Chronic Disease Support Fund',
    org: 'Lucen NGO Partners',
    orgType: 'NGO',
    orgColor: '#7C3AED',
    description: 'Quarterly grants to cover out-of-pocket medication and consultation costs for patients with long-term conditions.',
    covers: 'Any prescribed medication or consultation',
    eligibility: 'Active Lucen patient with 1+ chronic conditions',
    enrolled: false,
  },
  {
    id: 'a4',
    name: 'Statin Access Programme',
    org: 'AstraZeneca Nigeria',
    orgType: 'Pharma',
    orgColor: '#0D9488',
    description: 'Free or reduced-cost Atorvastatin for uninsured or under-insured patients with elevated LDL cholesterol.',
    covers: 'Atorvastatin 10mg, 20mg, 40mg',
    eligibility: 'LDL > 3.5 mmol/L; limited or no drug coverage',
    enrolled: false,
  },
];

const PROVIDER_CLAIMS: ProviderClaim[] = [
  { id: 'cl1', description: 'Lisinopril 10mg × 90 tabs',         date: '28 May 2026', amount: 4800,  plan: 'Hygeia HMO', status: 'Approved' },
  { id: 'cl2', description: 'Cardiology consult — Dr. Obi',      date: '14 May 2026', amount: 35000, plan: 'Hygeia HMO', status: 'Pending'  },
  { id: 'cl3', description: 'HbA1c blood test',                  date: '2 May 2026',  amount: 12500, plan: 'NHIS',       status: 'Approved' },
  { id: 'cl4', description: 'Atorvastatin 20mg × 30 tabs',       date: '18 Apr 2026', amount: 3200,  plan: 'Hygeia HMO', status: 'Approved' },
  { id: 'cl5', description: 'Physiotherapy × 3 sessions',        date: '5 Apr 2026',  amount: 22000, plan: 'Hygeia HMO', status: 'Rejected' },
];

const NETWORK_PROVIDERS: NetworkProvider[] = [
  { id: 'np1', name: 'Reddington Hospital',       type: 'Private Hospital', area: 'Victoria Island', plans: ['Hygeia HMO'], distance: '3.2 km' },
  { id: 'np2', name: 'Lagoon Hospitals',           type: 'Private Hospital', area: 'Victoria Island', plans: ['Hygeia HMO', 'NHIS'], distance: '4.7 km' },
  { id: 'np3', name: 'EKO Hospital',               type: 'Private Hospital', area: 'Ikeja',           plans: ['Hygeia HMO', 'NHIS'], distance: '8.1 km' },
  { id: 'np4', name: 'St. Nicholas Hospital',      type: 'Private Hospital', area: 'Lagos Island',    plans: ['Hygeia HMO'], distance: '5.5 km' },
  { id: 'np5', name: 'LUTH',                       type: 'Teaching Hospital', area: 'Idi-Araba',      plans: ['NHIS'], distance: '9.4 km' },
];

@Component({
  selector: 'lc-funding',
  standalone: true,
  imports: [],
  templateUrl: './funding.component.html',
  styleUrl: './funding.component.scss',
})
export class FundingComponent {
  readonly plans     = signal<CoveragePlan[]>(PLANS);
  readonly preAuths  = signal<PreAuthRequest[]>(PRE_AUTHS);
  readonly programs  = signal<AssistanceProgram[]>(PROGRAMS);
  readonly claims    = signal<ProviderClaim[]>(PROVIDER_CLAIMS);
  readonly providers = signal<NetworkProvider[]>(NETWORK_PROVIDERS);

  readonly enrolledCount  = computed(() => this.programs().filter(p => p.enrolled).length);
  readonly approvedPreAuths = computed(() => this.preAuths().filter(p => p.status === 'Approved').length);

  readonly stats = computed(() => [
    { value: '₦2.5M',                                label: 'Total coverage',      icon: '🛡️' },
    { value: String(this.plans().length),             label: 'Active plans',        icon: '📋' },
    { value: String(this.approvedPreAuths()),         label: 'Pre-auths approved',  icon: '✅' },
    { value: String(this.enrolledCount()),            label: 'Aid programmes',      icon: '🤝' },
  ]);

  readonly claimsFilter = signal<'all' | ClaimStatus>('all');

  readonly filteredClaims = computed(() => {
    const f = this.claimsFilter();
    return f === 'all' ? this.claims() : this.claims().filter(c => c.status === f);
  });

  setClaimsFilter(f: 'all' | ClaimStatus): void { this.claimsFilter.set(f); }

  toggleEnroll(id: string): void {
    this.programs.update(list =>
      list.map(p => p.id === id ? { ...p, enrolled: !p.enrolled } : p)
    );
  }

  formatAmount(n: number): string {
    return '₦' + n.toLocaleString('en-NG');
  }

  claimStatusColor(s: ClaimStatus): string {
    return s === 'Approved' ? '#059669' : s === 'Pending' ? '#D97706' : '#DC2626';
  }

  preAuthStatusColor(s: PreAuthStatus): string {
    return s === 'Approved' ? '#059669' : s === 'Under Review' ? '#2563EB' : '#D97706';
  }
}
