export type ApptStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled';
export type ApptType = 'Consultation' | 'Follow-up' | 'Lab Test' | 'Physiotherapy' | 'Specialist Review';
export type UrgencyLevel = 'today' | 'tomorrow' | 'soon' | null;

export interface Appointment {
  id: string;
  isoDate: string;
  day: string;
  dayNum: string;
  month: string;
  year: string;
  time: string;
  duration: string;
  provider: string;
  specialty: string;
  facility: string;
  type: ApptType;
  status: ApptStatus;
  note?: string;
}

export interface CreateAppointmentPayload {
  isoDate: string;
  time24: string;
  duration: string;
  provider: string;
  specialty: string;
  facility: string;
  type: ApptType;
  note?: string;
}

export interface RescheduleAppointmentPayload {
  isoDate: string;
  time24: string;
  duration: string;
  note?: string;
}

export interface UpdateAppointmentPayload {
  provider?: string;
  specialty?: string;
  facility?: string;
  type?: ApptType;
  note?: string;
}

export interface AppointmentStats {
  upcoming: number;
  thisMonth: number;
  completed: number;
  cancelled: number;
}

export function localMidnight(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayMidnight(): Date {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

export function deriveDateFields(isoDate: string): { day: string; dayNum: string; month: string; year: string } {
  const date = localMidnight(isoDate);
  return {
    day: date.toLocaleDateString('en-GB', { weekday: 'short' }),
    dayNum: String(date.getDate()),
    month: date.toLocaleDateString('en-GB', { month: 'short' }),
    year: String(date.getFullYear()),
  };
}

export function formatTime(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const ampm = h < 12 ? 'AM' : 'PM';
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export function daysUntil(isoDate: string): number {
  return Math.round((localMidnight(isoDate).getTime() - todayMidnight().getTime()) / 86_400_000);
}

export function urgency(isoDate: string): UrgencyLevel {
  const d = daysUntil(isoDate);
  if (d === 0) return 'today';
  if (d === 1) return 'tomorrow';
  if (d <= 7) return 'soon';
  return null;
}

export function upcomingAppointments(list: Appointment[]): Appointment[] {
  const today = todayMidnight();
  return list
    .filter(a => a.status !== 'cancelled' && localMidnight(a.isoDate) >= today)
    .sort((a, b) => a.isoDate.localeCompare(b.isoDate));
}

// Backend AppointmentType is a closed snake_case set; the frontend keeps the
// existing Title-Case labels for display/dropdowns and maps at the API boundary.
const TYPE_TO_CODE: Record<ApptType, string> = {
  'Consultation': 'consultation',
  'Follow-up': 'follow_up',
  'Lab Test': 'lab_test',
  'Physiotherapy': 'physiotherapy',
  'Specialist Review': 'specialist_review',
};

const CODE_TO_TYPE: Record<string, ApptType> = {
  consultation: 'Consultation',
  follow_up: 'Follow-up',
  lab_test: 'Lab Test',
  physiotherapy: 'Physiotherapy',
  specialist_review: 'Specialist Review',
};

export function typeToCode(type: ApptType): string {
  const code = TYPE_TO_CODE[type];
  if (!code) throw new Error(`Unknown appointment type: ${type}`);
  return code;
}

export function codeToType(code: string): ApptType {
  const type = CODE_TO_TYPE[code];
  if (!type) throw new Error(`Unknown appointment type code: ${code}`);
  return type;
}
