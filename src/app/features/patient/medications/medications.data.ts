export type DoseStatus    = 'taken' | 'pending' | 'later' | 'skipped';
export type RefillUrgency = 'urgent' | 'upcoming' | 'ok';

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  condition: string;
  frequency: string;
  schedule: string[];
  prescriber: string;
  specialty: string;
  pillsRemaining: number;
  pillsTotal: number;
  refillDate: string;
  refillDateISO?: string;
  refillUrgency: RefillUrgency;
}

export interface ScheduledDose {
  medName: string;
  dosage: string;
  note?: string;
  status: DoseStatus;
}

export interface ScheduleSlot {
  time: string;
  label: string;
  icon: string;
  doses: ScheduledDose[];
}

export interface RefillAlert {
  name: string;
  pillsLeft: number;
  refillDate: string;
  urgency: RefillUrgency;
}

export const SEED_MEDICATIONS: Medication[] = [
  {
    id: 'metformin', name: 'Metformin', dosage: '500 mg',
    condition: 'Type 2 Diabetes', frequency: 'Twice daily',
    schedule: ['8:00 AM', '8:00 PM'],
    prescriber: 'Dr. Sarah Chen', specialty: 'Endocrinology',
    pillsRemaining: 24, pillsTotal: 60,
    refillDate: '18 Jun 2026', refillDateISO: '2026-06-18', refillUrgency: 'ok',
  },
  {
    id: 'lisinopril', name: 'Lisinopril', dosage: '10 mg',
    condition: 'Hypertension', frequency: 'Once daily',
    schedule: ['8:00 AM'],
    prescriber: 'Dr. James Obi', specialty: 'Cardiology',
    pillsRemaining: 8, pillsTotal: 30,
    refillDate: '12 Jun 2026', refillDateISO: '2026-06-12', refillUrgency: 'urgent',
  },
  {
    id: 'aspirin', name: 'Aspirin', dosage: '75 mg',
    condition: 'Cardiovascular Prevention', frequency: 'Once daily',
    schedule: ['8:00 AM'],
    prescriber: 'Dr. James Obi', specialty: 'Cardiology',
    pillsRemaining: 30, pillsTotal: 30,
    refillDate: '4 Jul 2026', refillDateISO: '2026-07-04', refillUrgency: 'ok',
  },
  {
    id: 'atorvastatin', name: 'Atorvastatin', dosage: '20 mg',
    condition: 'High Cholesterol', frequency: 'Once daily',
    schedule: ['10:00 PM'],
    prescriber: 'Dr. James Obi', specialty: 'Cardiology',
    pillsRemaining: 14, pillsTotal: 30,
    refillDate: '25 Jun 2026', refillDateISO: '2026-06-25', refillUrgency: 'upcoming',
  },
  {
    id: 'vitamin-d3', name: 'Vitamin D3', dosage: '1000 IU',
    condition: 'Vitamin Deficiency', frequency: 'Once daily',
    schedule: ['8:00 AM'],
    prescriber: 'Dr. Sarah Chen', specialty: 'General Practice',
    pillsRemaining: 60, pillsTotal: 90,
    refillDate: '1 Aug 2026', refillDateISO: '2026-08-01', refillUrgency: 'ok',
  },
];

export const SEED_SCHEDULE: ScheduleSlot[] = [
  {
    time: '8:00 AM', label: 'Morning', icon: '🌅',
    doses: [
      { medName: 'Metformin',  dosage: '500 mg',  note: 'with breakfast', status: 'taken' },
      { medName: 'Lisinopril', dosage: '10 mg',                           status: 'taken' },
      { medName: 'Aspirin',    dosage: '75 mg',   note: 'with food',      status: 'taken' },
      { medName: 'Vitamin D3', dosage: '1000 IU', note: 'with food',      status: 'taken' },
    ],
  },
  {
    time: '8:00 PM', label: 'Evening', icon: '🌆',
    doses: [
      { medName: 'Metformin', dosage: '500 mg', note: 'with dinner', status: 'pending' },
    ],
  },
  {
    time: '10:00 PM', label: 'Bedtime', icon: '🌙',
    doses: [
      { medName: 'Atorvastatin', dosage: '20 mg', status: 'later' },
    ],
  },
];

export const SEED_REFILL_ALERTS: RefillAlert[] = [
  { name: 'Lisinopril 10 mg',   pillsLeft: 8,  refillDate: '12 Jun 2026', urgency: 'urgent'   },
  { name: 'Atorvastatin 20 mg', pillsLeft: 14, refillDate: '25 Jun 2026', urgency: 'upcoming' },
];
