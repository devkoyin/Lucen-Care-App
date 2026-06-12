import { Injectable, computed, effect, signal } from '@angular/core';

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

const SEED: Appointment[] = [
  {
    id: 'a1', isoDate: '2026-06-05',
    day: 'Fri', dayNum: '5', month: 'Jun', year: '2026',
    time: '10:30 AM', duration: '30 min',
    provider: 'Dr. Sarah Chen', specialty: 'General Practice',
    facility: 'Lucen Health Centre, Lagos',
    type: 'Consultation', status: 'confirmed',
    note: 'Bring your blood pressure log and any new symptoms.',
  },
  {
    id: 'a2', isoDate: '2026-06-12',
    day: 'Thu', dayNum: '12', month: 'Jun', year: '2026',
    time: '2:00 PM', duration: '45 min',
    provider: 'Dr. James Obi', specialty: 'Cardiology',
    facility: 'Lagos Heart Institute',
    type: 'Follow-up', status: 'confirmed',
    note: 'Lisinopril dosage review — bring current medication list.',
  },
  {
    id: 'a3', isoDate: '2026-06-20',
    day: 'Fri', dayNum: '20', month: 'Jun', year: '2026',
    time: '9:00 AM', duration: '45 min',
    provider: 'Dr. Amina Bello', specialty: 'Endocrinology',
    facility: 'Lucen Health Centre, Lagos',
    type: 'Specialist Review', status: 'confirmed',
    note: 'Fast for 8 hours before this appointment. HbA1c review.',
  },
  {
    id: 'a4', isoDate: '2026-06-25',
    day: 'Thu', dayNum: '25', month: 'Jun', year: '2026',
    time: '11:00 AM', duration: '1 hour',
    provider: 'Lagos General Hospital Lab', specialty: 'Pathology',
    facility: 'Lagos General Hospital',
    type: 'Lab Test', status: 'pending',
    note: 'Full blood panel — fasting required. Results in 48 hrs.',
  },
  {
    id: 'p1', isoDate: '2026-06-03',
    day: 'Wed', dayNum: '3', month: 'Jun', year: '2026',
    time: '3:00 PM', duration: '30 min',
    provider: 'PhysioLagos Clinic', specialty: 'Physiotherapy',
    facility: 'PhysioLagos, Victoria Island',
    type: 'Physiotherapy', status: 'cancelled',
  },
  {
    id: 'p2', isoDate: '2026-05-30',
    day: 'Sat', dayNum: '30', month: 'May', year: '2026',
    time: '9:00 AM', duration: '45 min',
    provider: 'Dr. Amina Bello', specialty: 'Endocrinology',
    facility: 'Lucen Health Centre, Lagos',
    type: 'Specialist Review', status: 'completed',
  },
  {
    id: 'p3', isoDate: '2026-05-22',
    day: 'Fri', dayNum: '22', month: 'May', year: '2026',
    time: '2:00 PM', duration: '30 min',
    provider: 'Dr. James Obi', specialty: 'Cardiology',
    facility: 'Lagos Heart Institute',
    type: 'Follow-up', status: 'completed',
  },
  {
    id: 'p4', isoDate: '2026-05-12',
    day: 'Tue', dayNum: '12', month: 'May', year: '2026',
    time: '10:30 AM', duration: '30 min',
    provider: 'Dr. Sarah Chen', specialty: 'General Practice',
    facility: 'Lucen Health Centre, Lagos',
    type: 'Consultation', status: 'completed',
  },
];

function localMidnight(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function todayMidnight(): Date {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

function formatTime(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const ampm = h < 12 ? 'AM' : 'PM';
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private readonly STORAGE_KEY = 'lc_appointments';
  private readonly _all = signal<Appointment[]>(this.load());

  readonly upcoming = computed(() => {
    const today = todayMidnight();
    return this._all()
      .filter(a => localMidnight(a.isoDate) >= today)
      .sort((a, b) => a.isoDate.localeCompare(b.isoDate));
  });

  readonly past = computed(() => {
    const today = todayMidnight();
    return this._all()
      .filter(a => localMidnight(a.isoDate) < today)
      .sort((a, b) => b.isoDate.localeCompare(a.isoDate));
  });

  readonly nextAppointment = computed(() => this.upcoming()[0] ?? null);

  readonly stats = computed(() => {
    const now = new Date();
    const curMonth = now.toLocaleDateString('en-GB', { month: 'short' });
    const curYear = String(now.getFullYear());
    const all = this._all();
    return {
      upcoming: this.upcoming().length,
      thisMonth: this.upcoming().filter(a => a.month === curMonth && a.year === curYear).length,
      completed: all.filter(a => a.status === 'completed').length,
      cancelled: all.filter(a => a.status === 'cancelled').length,
    };
  });

  constructor() {
    effect(() => {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._all()));
    });
  }

  daysUntil(isoDate: string): number {
    return Math.round(
      (localMidnight(isoDate).getTime() - todayMidnight().getTime()) / 86_400_000
    );
  }

  urgency(isoDate: string): UrgencyLevel {
    const d = this.daysUntil(isoDate);
    if (d === 0) return 'today';
    if (d === 1) return 'tomorrow';
    if (d <= 7) return 'soon';
    return null;
  }

  reschedule(id: string, data: {
    isoDate: string;
    time24: string;
    duration: string;
    note?: string;
  }): void {
    this._all.update(list =>
      list.map(a => {
        if (a.id !== id) return a;
        const date = localMidnight(data.isoDate);
        return {
          ...a,
          isoDate: data.isoDate,
          day: date.toLocaleDateString('en-GB', { weekday: 'short' }),
          dayNum: String(date.getDate()),
          month: date.toLocaleDateString('en-GB', { month: 'short' }),
          year: String(date.getFullYear()),
          time: formatTime(data.time24),
          duration: data.duration,
          note: data.note !== undefined ? (data.note || undefined) : a.note,
          status: 'confirmed',
        };
      })
    );
  }

  add(data: {
    isoDate: string;
    time24: string;
    duration: string;
    provider: string;
    specialty: string;
    facility: string;
    type: ApptType;
    note?: string;
  }): void {
    const date = localMidnight(data.isoDate);
    const appt: Appointment = {
      id: crypto.randomUUID(),
      isoDate: data.isoDate,
      day: date.toLocaleDateString('en-GB', { weekday: 'short' }),
      dayNum: String(date.getDate()),
      month: date.toLocaleDateString('en-GB', { month: 'short' }),
      year: String(date.getFullYear()),
      time: formatTime(data.time24),
      duration: data.duration,
      provider: data.provider,
      specialty: data.specialty,
      facility: data.facility,
      type: data.type,
      status: 'confirmed',
      note: data.note || undefined,
    };
    this._all.update(list => [...list, appt]);
  }

  private load(): Appointment[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Appointment[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* fall through to seed */ }
    return SEED;
  }
}
