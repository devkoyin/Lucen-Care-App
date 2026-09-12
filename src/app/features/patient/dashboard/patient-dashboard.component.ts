import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { AppointmentsService } from '../../../core/appointments/appointments.service';
import { Appointment, UrgencyLevel, upcomingAppointments, urgency } from '../../../core/appointments/appointments.models';
import { PatientEnrollment, PatientService } from '../../../core/patients/patient.service';
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
    { icon: '💰', label: 'Browse Funding',   route: '/patient/funding/available' },
  ];

  readonly statusLabel = doseStatusLabel;

  readonly upcomingAppointments = signal<Appointment[]>([]);
  get upcomingPreview() { return this.upcomingAppointments().slice(0, 3); }

  readonly nextAppointmentUrgency = signal<UrgencyLevel>(null);
  get nextUrgency() { return this.nextAppointmentUrgency(); }

  readonly medications = signal<Medication[]>([]);
  /**
   * The patient's own applications. This used to be a bare count rendered as "new
   * funding matches", which was two things at once: it counted applications the
   * patient had already made, and it described them as programmes they had not.
   */
  readonly enrollments = signal<PatientEnrollment[]>([]);

  /** Waiting on someone else to act, which is what a patient checks the page for. */
  readonly awaitingDecision = computed(
    () => this.enrollments().filter(e => e.status === 'active' || e.status === 'waitlisted').length,
  );
  readonly selectedCount = computed(
    () => this.enrollments().filter(e => e.status === 'selected').length,
  );
  readonly hasApplications = computed(() => this.enrollments().length > 0);

  /** Decisions first: being selected outranks still waiting. */
  readonly fundingTitle = computed(() => {
    const selected = this.selectedCount();
    if (selected > 0) return `${selected} funding ${selected === 1 ? 'application' : 'applications'} approved`;

    const awaiting = this.awaitingDecision();
    if (awaiting > 0) return `${awaiting} ${awaiting === 1 ? 'application' : 'applications'} under review`;

    return this.hasApplications() ? 'Your funding applications' : 'Find funding support';
  });

  readonly fundingDesc = computed(() => {
    if (this.selectedCount() > 0) return 'You have a place on a programme. Open it to see the next steps.';
    if (this.awaitingDecision() > 0) return 'The programme team has your application and has not decided yet.';
    if (this.hasApplications()) return 'See the outcome of everything you have applied to.';
    return 'NGO programmes can help cover the cost of your care.';
  });

  readonly fundingCta = computed(() => (this.hasApplications() ? 'View applications' : 'Browse programmes'));

  /** Their own applications when they have any, the browse list when they do not. */
  readonly fundingRoute = computed(() =>
    this.hasApplications() ? '/patient/funding/plans' : '/patient/funding/available',
  );

  ngOnInit(): void {
    this.medicationsService.getSchedule().subscribe({
      next: slots => this.medications.set(this.toMedicationDisplay(slots)),
    });

    this.patientService.getEnrollments().subscribe({
      next: result => this.enrollments.set(result.enrollments),
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
