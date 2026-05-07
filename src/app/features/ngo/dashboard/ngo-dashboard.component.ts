import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

interface StatCard {
  label: string;
  value: string | number;
  trend?: string;
  accent?: boolean;
}

interface Applicant {
  name: string;
  condition: string;
  program: string;
  status: 'new' | 'reviewing' | 'selected' | 'rejected';
  appliedDays: number;
}

interface Program {
  name: string;
  filled: number;
  total: number;
  status: 'active' | 'closing' | 'full';
}

@Component({
  selector: 'lc-ngo-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './ngo-dashboard.component.html',
  styleUrl: './ngo-dashboard.component.scss',
})
export class NgoDashboardComponent {
  private readonly auth = inject(AuthService);

  get orgName(): string { return this.auth.user()?.name ?? 'your organisation'; }

  readonly stats: StatCard[] = [
    { label: 'Active Programs', value: 6, trend: '+1 this month' },
    { label: 'Total Applicants', value: 214, trend: '+18 this week' },
    { label: 'Selected Patients', value: 89 },
    { label: 'Pending Review', value: 43, accent: true },
  ];

  readonly applicants: Applicant[] = [
    { name: 'Fatima Yusuf', condition: 'Type 2 Diabetes', program: 'Chronic Care Fund', status: 'new', appliedDays: 1 },
    { name: 'Emmanuel Okafor', condition: 'Hypertension', program: 'Cardiac Support', status: 'reviewing', appliedDays: 3 },
    { name: 'Grace Mensah', condition: 'Asthma', program: 'Respiratory Aid', status: 'selected', appliedDays: 5 },
    { name: 'Kwame Asante', condition: 'Sickle Cell', program: 'Sickle Cell Fund', status: 'new', appliedDays: 1 },
    { name: 'Amara Diallo', condition: 'Malnutrition', program: 'Child Health', status: 'reviewing', appliedDays: 2 },
  ];

  readonly programs: Program[] = [
    { name: 'Chronic Care Fund', filled: 34, total: 50, status: 'active' },
    { name: 'Cardiac Support Program', filled: 22, total: 25, status: 'closing' },
    { name: 'Respiratory Aid Initiative', filled: 18, total: 40, status: 'active' },
    { name: 'Child Nutrition Fund', filled: 15, total: 15, status: 'full' },
  ];

  statusLabel(status: Applicant['status']): string {
    return { new: 'New', reviewing: 'In Review', selected: 'Selected', rejected: 'Rejected' }[status];
  }

  fillPercent(p: Program): number {
    return Math.round((p.filled / p.total) * 100);
  }
}
