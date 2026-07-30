export type ClaimStatus   = 'Approved' | 'Pending' | 'Rejected';
export type PreAuthStatus = 'Approved' | 'Under Review' | 'Pending';
export type PlanType      = 'HMO' | 'Government' | 'NGO';

export interface CoveragePlan {
  id: string;
  name: string;
  provider: string;
  type: PlanType;
  typeColor: string;
  memberNumber: string;
  renewalDate: string;
  coverageItems: { label: string; value: string }[];
}

export interface PreAuthRequest {
  id: string;
  procedure: string;
  requestedBy: string;
  requestDate: string;
  plan: string;
  status: PreAuthStatus;
  note?: string;
}

export interface AssistanceProgram {
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

export interface ProviderClaim {
  id: string;
  description: string;
  date: string;
  amount: number;
  plan: string;
  status: ClaimStatus;
}

export interface NetworkProvider {
  id: string;
  name: string;
  type: string;
  area: string;
  plans: string[];
  distance: string;
}

export const SEED_PLANS: CoveragePlan[] = [];

export const SEED_PRE_AUTHS: PreAuthRequest[] = [];

export const SEED_PROGRAMS: AssistanceProgram[] = [
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

export const SEED_CLAIMS: ProviderClaim[] = [];

export const SEED_PROVIDERS: NetworkProvider[] = [];
