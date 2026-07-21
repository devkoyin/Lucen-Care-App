import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { PatientService } from '../../../core/patients/patient.service';
import { DoseStatus, ScheduleSlot } from '../../../core/medications/medications.models';
import { MedicationsService } from '../../../core/medications/medications.service';

interface Medication {
  name: string;
  dosage: string;
  nextDue: string;
  status: DoseStatus;
}

@Component({
  selector: 'lc-patient-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './patient-dashboard.component.html',
  styleUrl: './patient-dashboard.component.scss',
})
export class PatientDashboardComponent implements OnInit {
  private readonly auth               = inject(AuthService);
  private readonly patientService     = inject(PatientService);
  private readonly medicationsService = inject(MedicationsService);
  readonly apptService                = inject(AppointmentsService);

  get greeting(): string { return this.auth.user()?.name ?? 'there'; }

  readonly today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  readonly quickActions = [
    { icon: '💊', label: 'Add Medication',  route: '/patient/medications' },
    { icon: '📅', label: 'Book Appointment', route: '/patient/appointments' },
    { icon: '🤖', label: 'Ask AI',           route: '/patient/ai-chat' },
    { icon: '💰', label: 'Browse Funding',   route: '/patient/funding' },
  ];

  // Upcoming appointments still come from AppointmentsService (localStorage mock until backend has the endpoint)
  get upcomingPreview() { return this.apptService.upcoming().slice(0, 3); }

  get nextUrgency() {
    const next = this.apptService.nextAppointment();
    return next ? this.apptService.urgency(next.isoDate) : null;
  }

  readonly medications = signal<Medication[]>([]);
  readonly fundingMatches = signal<number>(0);

  ngOnInit(): void {
    this.medicationsService.getSchedule().subscribe({
      next: slots => this.medications.set(this.toMedicationDisplay(slots)),
    });

    this.patientService.getEnrollments().subscribe({
      next: result => this.fundingMatches.set(result.enrollments.length),
    });
  }

  statusLabel(status: DoseStatus): string {
    return { taken: 'Taken', pending: 'Due', later: 'Later', skipped: 'Skipped' }[status];
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
