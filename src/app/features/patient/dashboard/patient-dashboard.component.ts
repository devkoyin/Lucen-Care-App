import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

type MedStatus = 'taken' | 'pending' | 'later';

interface Appointment {
  date: string;
  time: string;
  provider: string;
  type: string;
}

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
export class PatientDashboardComponent {
  private readonly auth = inject(AuthService);

  get greeting(): string { return this.auth.user()?.name ?? 'there'; }

  readonly today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  readonly quickActions = [
    { icon: '💊', label: 'Add Medication', route: '/patient/medications' },
    { icon: '📅', label: 'Book Appointment', route: '/patient/appointments' },
    { icon: '🤖', label: 'Ask AI', route: '/patient/ai-chat' },
    { icon: '💰', label: 'Browse Funding', route: '/patient/funding' },
  ];

  readonly appointments: Appointment[] = [
    { date: 'Mon 12 May', time: '10:30 AM', provider: 'Dr. Sarah Chen', type: 'General Practice' },
    { date: 'Thu 15 May', time: '2:00 PM', provider: 'Dr. James Obi', type: 'Cardiology' },
    { date: 'Fri 23 May', time: '9:00 AM', provider: 'Dr. Amina Bello', type: 'Endocrinology' },
  ];

  readonly medications: Medication[] = [
    { name: 'Metformin 500mg', dosage: 'Twice daily', nextDue: '8:00 PM today', status: 'taken' },
    { name: 'Lisinopril 10mg', dosage: 'Once daily', nextDue: '8:00 PM today', status: 'pending' },
    { name: 'Aspirin 75mg', dosage: 'Once daily', nextDue: 'Tomorrow 8:00 AM', status: 'later' },
  ];

  readonly fundingMatches = 2;

  statusLabel(status: MedStatus): string {
    return { taken: 'Taken', pending: 'Due', later: 'Later' }[status];
  }
}
