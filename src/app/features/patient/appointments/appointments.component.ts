import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { AppointmentsService } from '../../../core/appointments/appointments.service';
import {
  Appointment,
  AppointmentStats,
  UrgencyLevel,
  daysUntil,
  localMidnight,
  todayMidnight,
  upcomingAppointments,
  urgency,
} from '../../../core/appointments/appointments.models';
import { ConfirmModalComponent } from '../../../shared/components/modal/confirm-modal.component';
import { CalendarIconComponent } from '../../../shared/components/calendar-icon/calendar-icon.component';
import { BookAppointmentModalComponent } from './book-appointment-modal.component';
import { RescheduleModalComponent } from './reschedule-modal.component';

const EMPTY_STATS: AppointmentStats = { upcoming: 0, thisMonth: 0, completed: 0, cancelled: 0 };

@Component({
  selector: 'lc-appointments',
  standalone: true,
  imports: [BookAppointmentModalComponent, RescheduleModalComponent, ConfirmModalComponent, CalendarIconComponent],
  templateUrl: './appointments.component.html',
  styleUrl: './appointments.component.scss',
})
export class AppointmentsComponent implements OnInit {
  private readonly appointmentsService = inject(AppointmentsService);

  readonly appointments = signal<Appointment[]>([]);
  readonly appointmentStats = signal<AppointmentStats>(EMPTY_STATS);

  readonly showModal = signal(false);
  readonly reminderDismissed = signal(false);
  readonly reschedulingAppt = signal<Appointment | null>(null);
  readonly expandedNoteId = signal<string | null>(null);
  readonly cancellingAppt = signal<Appointment | null>(null);
  readonly cancelSubmitting = signal(false);
  readonly cancelError = signal<string | null>(null);

  readonly upcoming = computed(() => upcomingAppointments(this.appointments()));

  readonly past = computed(() => {
    const today = todayMidnight();
    return this.appointments()
      .filter(a => a.status === 'cancelled' || localMidnight(a.isoDate) < today)
      .sort((a, b) => b.isoDate.localeCompare(a.isoDate));
  });

  readonly nextAppointment = computed(() => this.upcoming()[0] ?? null);

  readonly hasAnyAppointments = computed(() => this.appointments().length > 0);

  readonly stats = computed(() => {
    const s = this.appointmentStats();
    return [
      { value: String(s.upcoming), label: 'Upcoming', icon: '📅', liveIcon: 'calendar' as const },
      { value: String(s.thisMonth), label: 'This Month', icon: '📆', liveIcon: 'calendar' as const },
      { value: String(s.completed), label: 'Completed', icon: '✅', liveIcon: undefined },
      { value: String(s.cancelled), label: 'Cancelled', icon: '✕', liveIcon: undefined },
    ];
  });

  readonly reminderAppt = computed(() => {
    if (this.reminderDismissed()) return null;
    const next = this.nextAppointment();
    if (!next) return null;
    const u = urgency(next.isoDate);
    return u === 'today' || u === 'tomorrow' ? { appt: next, urgency: u } : null;
  });

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.appointmentsService.getAppointments().subscribe({
      next: list => this.appointments.set(list),
    });
    this.appointmentsService.getStats().subscribe({
      next: s => this.appointmentStats.set(s),
    });
  }

  dismissReminder(): void { this.reminderDismissed.set(true); }

  confirmCancelAppointment(): void {
    const appt = this.cancellingAppt();
    if (!appt) return;
    this.cancelSubmitting.set(true);
    this.cancelError.set(null);
    this.appointmentsService.cancelAppointment(appt.id).subscribe({
      next: () => {
        this.cancelSubmitting.set(false);
        this.cancellingAppt.set(null);
        this.reload();
      },
      error: () => {
        this.cancelSubmitting.set(false);
        this.cancelError.set('Could not cancel this appointment. Please try again.');
      },
    });
  }

  dismissCancelModal(): void {
    this.cancellingAppt.set(null);
    this.cancelError.set(null);
  }

  toggleNotes(id: string): void {
    this.expandedNoteId.update(cur => (cur === id ? null : id));
  }

  urgencyLabel(isoDate: string): string | null {
    const u = urgency(isoDate);
    if (u === 'today') return 'Today';
    if (u === 'tomorrow') return 'Tomorrow';
    if (u === 'soon') return `In ${daysUntil(isoDate)} days`;
    return null;
  }

  urgencyLevel(isoDate: string): UrgencyLevel {
    return urgency(isoDate);
  }

  statusLabel(status: string): string {
    return ({ confirmed: 'Confirmed', pending: 'Pending', completed: 'Completed', cancelled: 'Cancelled' } as Record<string, string>)[status] ?? status;
  }

  typeIcon(type: string): string {
    return ({
      'Consultation':      '🩺',
      'Follow-up':         '🔄',
      'Lab Test':          '🧪',
      'Physiotherapy':     '🏃',
      'Specialist Review': '👨‍⚕️',
    } as Record<string, string>)[type] ?? '📋';
  }
}
