import { Component, computed, inject, signal } from '@angular/core';
import { AppointmentsService, Appointment, UrgencyLevel } from './appointments.service';
import { BookAppointmentModalComponent } from './book-appointment-modal.component';
import { RescheduleModalComponent } from './reschedule-modal.component';

@Component({
  selector: 'lc-appointments',
  standalone: true,
  imports: [BookAppointmentModalComponent, RescheduleModalComponent],
  templateUrl: './appointments.component.html',
  styleUrl: './appointments.component.scss',
})
export class AppointmentsComponent {
  readonly service = inject(AppointmentsService);

  readonly showModal = signal(false);
  readonly reminderDismissed = signal(false);
  readonly reschedulingAppt = signal<Appointment | null>(null);

  readonly stats = computed(() => {
    const s = this.service.stats();
    return [
      { value: String(s.upcoming),  label: 'Upcoming',   icon: '📅' },
      { value: String(s.thisMonth), label: 'This Month', icon: '📆' },
      { value: String(s.completed), label: 'Completed',  icon: '✅' },
      { value: String(s.cancelled), label: 'Cancelled',  icon: '✕'  },
    ];
  });

  readonly reminderAppt = computed(() => {
    if (this.reminderDismissed()) return null;
    const next = this.service.nextAppointment();
    if (!next) return null;
    const urgency = this.service.urgency(next.isoDate);
    return urgency === 'today' || urgency === 'tomorrow'
      ? { appt: next, urgency }
      : null;
  });

  dismissReminder(): void { this.reminderDismissed.set(true); }

  urgencyLabel(isoDate: string): string | null {
    const u = this.service.urgency(isoDate);
    if (u === 'today') return 'Today';
    if (u === 'tomorrow') return 'Tomorrow';
    if (u === 'soon') return `In ${this.service.daysUntil(isoDate)} days`;
    return null;
  }

  urgencyLevel(isoDate: string): UrgencyLevel {
    return this.service.urgency(isoDate);
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
