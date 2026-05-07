import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

interface StatCard {
  label: string;
  value: string | number;
  sub?: string;
}

interface Study {
  title: string;
  condition: string;
  enrolled: number;
  target: number;
  status: 'recruiting' | 'active' | 'closed' | 'draft';
}

interface Interest {
  patientId: string;
  studyTitle: string;
  daysAgo: number;
  status: 'pending' | 'connected';
}

@Component({
  selector: 'lc-researcher-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './researcher-dashboard.component.html',
  styleUrl: './researcher-dashboard.component.scss',
})
export class ResearcherDashboardComponent {
  private readonly auth = inject(AuthService);

  get researcherName(): string { return this.auth.user()?.name ?? 'Researcher'; }

  readonly stats: StatCard[] = [
    { label: 'Active Studies', value: 4 },
    { label: 'Interested Patients', value: 67, sub: 'Across all studies' },
    { label: 'Enrolled', value: 23, sub: 'Confirmed participants' },
    { label: 'Recruiting', value: 3, sub: 'Studies open now' },
  ];

  readonly studies: Study[] = [
    { title: 'Metformin Adherence in T2D', condition: 'Type 2 Diabetes', enrolled: 12, target: 30, status: 'recruiting' },
    { title: 'Hypertension & Sleep Quality', condition: 'Hypertension', enrolled: 8, target: 20, status: 'recruiting' },
    { title: 'Sickle Cell Pain Management', condition: 'Sickle Cell', enrolled: 3, target: 15, status: 'recruiting' },
    { title: 'Post-COVID Fatigue Study', condition: 'Long COVID', enrolled: 20, target: 20, status: 'active' },
  ];

  readonly recentInterest: Interest[] = [
    { patientId: 'Patient #4821', studyTitle: 'Metformin Adherence in T2D', daysAgo: 1, status: 'pending' },
    { patientId: 'Patient #3047', studyTitle: 'Hypertension & Sleep Quality', daysAgo: 1, status: 'pending' },
    { patientId: 'Patient #1193', studyTitle: 'Metformin Adherence in T2D', daysAgo: 2, status: 'connected' },
    { patientId: 'Patient #6654', studyTitle: 'Sickle Cell Pain Management', daysAgo: 3, status: 'pending' },
    { patientId: 'Patient #2218', studyTitle: 'Hypertension & Sleep Quality', daysAgo: 4, status: 'connected' },
  ];

  enrollPercent(s: Study): number {
    return Math.round((s.enrolled / s.target) * 100);
  }

  statusLabel(status: Study['status']): string {
    return { recruiting: 'Recruiting', active: 'Active', closed: 'Closed', draft: 'Draft' }[status];
  }
}
