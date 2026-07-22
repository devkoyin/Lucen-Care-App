export type DoseStatus = 'taken' | 'pending' | 'due_now' | 'later' | 'skipped';
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
  refillDate: string;      // display label, derived from refillDateISO
  refillDateISO: string;
  refillUrgency: RefillUrgency; // derived client-side from refillDateISO
  notes?: string;
}

export interface CreateMedicationPayload {
  name: string;
  dosage: string;
  condition: string;
  frequency: string;
  scheduleTimes: string[];
  prescriber: string;
  specialty: string;
  pillsTotal: number;
  refillDate: string; // ISO date YYYY-MM-DD
  notes?: string;
}

export interface ScheduledDose {
  doseLogId: string;
  medicationId: string;
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
  medicationId: string;
  name: string;
  pillsLeft: number;
  refillDate: string;
  refillDateISO: string;
  urgency: RefillUrgency;
}

export interface MedicationStats {
  activeMeds: number;
  takenToday: number;
  dueToday: number;
  adherenceStreakDays: number;
}

// Matches MedicationsService.calcUrgency on the backend — same thresholds so
// urgency reads the same regardless of which side computed it.
export function calcRefillUrgency(refillDateISO: string): RefillUrgency {
  const days = Math.floor((new Date(refillDateISO).getTime() - Date.now()) / 86_400_000);
  return days <= 7 ? 'urgent' : days <= 14 ? 'upcoming' : 'ok';
}

export function formatRefillDate(refillDateISO: string): string {
  return new Date(refillDateISO + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

const SLOT_META: Record<string, { label: string; icon: string }> = {
  '8:00 AM': { label: 'Morning', icon: '🌅' },
  '2:00 PM': { label: 'Afternoon', icon: '☀️' },
  '8:00 PM': { label: 'Evening', icon: '🌆' },
  '10:00 PM': { label: 'Bedtime', icon: '🌙' },
};

export function slotMeta(time: string): { label: string; icon: string } {
  return SLOT_META[time] ?? { label: time, icon: '⏰' };
}

const DOSE_STATUS_LABELS: Record<DoseStatus, string> = {
  taken: 'Taken',
  pending: 'Upcoming',
  due_now: 'Due now',
  later: 'Later',
  skipped: 'Skipped',
};

export function doseStatusLabel(status: DoseStatus): string {
  return DOSE_STATUS_LABELS[status];
}
