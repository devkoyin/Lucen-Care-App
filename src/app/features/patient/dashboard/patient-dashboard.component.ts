import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { PatientService, MedicationEntry } from '../../../core/patients/patient.service';

type MedStatus = 'taken' | 'pending' | 'later';

interface Medication {
  name: string;
  dosage: string;
  nextDue: string;
  status: MedStatus;
}

@Component({
  selector: 'lc-patient-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './patient-dashboard.component.html',
  styleUrl: './patient-dashboard.component.scss',
})
export class PatientDashboardComponent implements OnInit {
  private readonly auth           = inject(AuthService);
  private readonly patientService = inject(PatientService);
  readonly apptService            = inject(AppointmentsService);

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
    this.patientService.getProfile().subscribe({
      next: profile => {
        if (profile.medicationList?.length) {
          this.medications.set(this.toMedicationDisplay(profile.medicationList));
        }
      },
    });

    this.patientService.getEnrollments().subscribe({
      next: result => this.fundingMatches.set(result.enrollments.length),
    });
  }

  statusLabel(status: MedStatus): string {
    return { taken: 'Taken', pending: 'Due', later: 'Later' }[status];
  }

  private toMedicationDisplay(meds: MedicationEntry[]): Medication[] {
    return meds.map(m => ({
      name: m.name,
      dosage: m.dosage,
      nextDue: m.frequency,
      status: 'pending' as MedStatus,
    }));
  }
}
