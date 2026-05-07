import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

interface StatCard {
  label: string;
  value: string | number;
  sub?: string;
  variant?: 'default' | 'warning';
}

interface PatientActivity {
  name: string;
  activity: string;
  timeAgo: string;
  completeness: number;
}

@Component({
  selector: 'lc-hmo-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './hmo-dashboard.component.html',
  styleUrl: './hmo-dashboard.component.scss',
})
export class HmoDashboardComponent {
  private readonly auth = inject(AuthService);

  get orgName(): string { return this.auth.user()?.name ?? 'your organisation'; }

  readonly stats: StatCard[] = [
    { label: 'Enrolled Patients', value: 1284, sub: 'Total active' },
    { label: 'New This Month', value: 47, sub: '+12% vs last month' },
    { label: 'Profile Completeness', value: '73%', sub: 'Average across roster' },
    { label: 'Flagged for Review', value: 12, variant: 'warning' },
  ];

  readonly recentActivity: PatientActivity[] = [
    { name: 'Emeka Nwosu', activity: 'Lab results added', timeAgo: '2h ago', completeness: 88 },
    { name: 'Aisha Mohammed', activity: 'Appointment scheduled', timeAgo: '4h ago', completeness: 64 },
    { name: 'Chidi Okonkwo', activity: 'Medication updated', timeAgo: '6h ago', completeness: 95 },
    { name: 'Ngozi Adeyemi', activity: 'Profile created', timeAgo: '1d ago', completeness: 32 },
    { name: 'Bola Dike', activity: 'Flagged for review', timeAgo: '1d ago', completeness: 71 },
  ];

  completenessColor(pct: number): string {
    if (pct >= 80) return '#34D399';
    if (pct >= 50) return '#F59E0B';
    return '#EF4444';
  }
}
