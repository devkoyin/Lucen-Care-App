export type DoseStatus = 'taken' | 'pending' | 'due_now' | 'later' | 'skipped';

/**
 * The subset a client may write. Mirrors LOGGABLE_DOSE_STATUSES on the backend:
 * 'due_now' is a read-time overlay only and POSTing it returns 422.
 */
export type LoggableDoseStatus = Exclude<DoseStatus, 'due_now'>;
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

/**
 * Mirrors the backend's UpdateMedicationDto, which accepts everything the create DTO
 * does plus `pillsRemaining` — needed so lowering pillsTotal can bring the remaining
 * count down with it. The API runs forbidNonWhitelisted, so no other field may be sent.
 */
export type UpdateMedicationPayload = Partial<CreateMedicationPayload> & {
  pillsRemaining?: number;
};

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

/**
 * Matches the backend's DOSE_TIME_PATTERN: a 12-hour label, optionally prefixed
 * with a weekday for weekly medications — '8:00 AM' or 'Monday · 8:00 AM'.
 */
const DOSE_TIME_PATTERN = /^(?:([A-Za-z]+)\s*·\s*)?(\d{1,2}):(\d{2})\s*(AM|PM)$/i;

/** Minutes since midnight for a dose label, or undefined if unparseable. */
export function doseTimeMinutes(time: string): number | undefined {
  const match = DOSE_TIME_PATTERN.exec(time.trim());
  if (!match) return undefined;

  let hour = Number(match[2]) % 12;
  if (match[4].toUpperCase() === 'PM') hour += 12;
  return hour * 60 + Number(match[3]);
}

/**
 * Groups a dose time into a part of day. Derived from the hour rather than looked up,
 * because dose times are free-form — a fixed 4-entry table fell through to the raw
 * time and a generic ⏰ for anything else, losing the grouping the Schedule tab is
 * built around.
 */
export function slotMeta(time: string): { label: string; icon: string } {
  const minutes = doseTimeMinutes(time);
  if (minutes === undefined) return { label: time, icon: '⏰' };

  const hour = Math.floor(minutes / 60);
  if (hour < 12) return { label: 'Morning', icon: '🌅' };
  if (hour < 17) return { label: 'Afternoon', icon: '☀️' };
  if (hour < 21) return { label: 'Evening', icon: '🌆' };
  return { label: 'Bedtime', icon: '🌙' };
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
