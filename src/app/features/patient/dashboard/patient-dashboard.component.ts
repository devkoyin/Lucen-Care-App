import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { AppointmentsService } from '../../../core/appointments/appointments.service';
import { Appointment, UrgencyLevel, upcomingAppointments, urgency } from '../../../core/appointments/appointments.models';
import { PatientService } from '../../../core/patients/patient.service';
import { DoseStatus, ScheduleSlot, doseStatusLabel } from '../../../core/medications/medications.models';
import { MedicationsService } from '../../../core/medications/medications.service';
import { CalendarIconComponent } from '../../../shared/components/calendar-icon/calendar-icon.component';

interface Medication {
  name: string;
  dosage: string;
  nextDue: string;
  status: DoseStatus;
}

interface QuickAction {
  icon: string;
  label: string;
  route: string;
  liveIcon?: 'calendar';
}

@Component({
  selector: 'lc-patient-dashboard',
  standalone: true,
  imports: [RouterLink, CalendarIconComponent],
  templateUrl: './patient-dashboard.component.html',
  styleUrl: './patient-dashboard.component.scss',
})
export class PatientDashboardComponent implements OnInit {
  private readonly auth               = inject(AuthService);
  private readonly patientService     = inject(PatientService);
  private readonly medicationsService = inject(MedicationsService);
  private readonly appointmentsService = inject(AppointmentsService);

  get greeting(): string { return this.auth.user()?.name ?? 'there'; }

  readonly today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  readonly quickActions: QuickAction[] = [
    // /patient/medications redirects to the Schedule tab, which has no Add button.
    { icon: '💊', label: 'Add Medication',  route: '/patient/medications/all' },
    { icon: '📅', label: 'Book Appointment', route: '/patient/appointments', liveIcon: 'calendar' },
    { icon: '🤖', label: 'Ask AI',           route: '/patient/ai-chat' },
    { icon: '💰', label: 'Browse Funding',   route: '/patient/funding' },
  ];

  readonly statusLabel = doseStatusLabel;

  readonly upcomingAppointments = signal<Appointment[]>([]);
  get upcomingPreview() { return this.upcomingAppointments().slice(0, 3); }

  readonly nextAppointmentUrgency = signal<UrgencyLevel>(null);
  get nextUrgency() { return this.nextAppointmentUrgency(); }

  readonly medications = signal<Medication[]>([]);
  readonly fundingMatches = signal<number>(0);

  ngOnInit(): void {
    this.medicationsService.getSchedule().subscribe({
      next: slots => this.medications.set(this.toMedicationDisplay(slots)),
    });

    this.patientService.getEnrollments().subscribe({
      next: result => this.fundingMatches.set(result.enrollments.length),
    });

    this.appointmentsService.getAppointments().subscribe({
      next: list => {
        const upcoming = upcomingAppointments(list);
        this.upcomingAppointments.set(upcoming);
        this.nextAppointmentUrgency.set(upcoming[0] ? urgency(upcoming[0].isoDate) : null);
      },
    });
  }

  private toMedicationDisplay(slots: ScheduleSlot[]): Medication[] {
    return slots.flatMap(slot =>
      slot.doses.map(dose => ({
        name: dose.medName,
        dosage: dose.dosage,
        nextDue: slot.time,
        status: dose.status,
      })),
    );
  }
}
