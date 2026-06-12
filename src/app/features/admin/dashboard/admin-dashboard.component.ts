import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApplicationsService } from '../../../core/applications/applications.service';

interface StatCard {
  label: string;
  value: number;
  trend?: string;
  accent?: boolean;
}

interface RecentActivity {
  orgName: string;
  type: 'NGO' | 'HMO';
  action: 'submitted' | 'approved' | 'rejected';
  actor: string;
  time: string;
}

@Component({
  selector: 'lc-admin-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent {
  private readonly appsService = inject(ApplicationsService);

  get stats(): StatCard[] {
    return [
      { label: 'Pending NGOs',   value: this.appsService.pendingCount('ngo'), accent: true },
      { label: 'Pending HMOs',   value: this.appsService.pendingCount('hmo'), accent: true },
      { label: 'Approved (30d)', value: this.appsService.recentCount('approved', 30) },
      { label: 'Rejected (30d)', value: this.appsService.recentCount('rejected', 30) },
    ];
  }

  get ngoPendingCount(): number { return this.appsService.pendingCount('ngo'); }
  get hmoPendingCount(): number { return this.appsService.pendingCount('hmo'); }

  readonly activity: RecentActivity[] = [
    { orgName: 'HealthBridge NGO',       type: 'NGO', action: 'submitted', actor: 'System',        time: '2 hours ago' },
    { orgName: 'Apex Health HMO',        type: 'HMO', action: 'approved',  actor: 'Admin Taiwo',   time: '5 hours ago' },
    { orgName: 'CareReach Foundation',   type: 'NGO', action: 'submitted', actor: 'System',        time: 'Yesterday' },
    { orgName: 'NovaCare HMO',           type: 'HMO', action: 'rejected',  actor: 'Admin Balogun', time: 'Yesterday' },
    { orgName: 'WellSpring Initiative',  type: 'NGO', action: 'approved',  actor: 'Admin Taiwo',   time: '2 days ago' },
    { orgName: 'PrimeCare HMO',          type: 'HMO', action: 'submitted', actor: 'System',        time: '2 days ago' },
  ];

  actionClass(action: RecentActivity['action']): string {
    return { submitted: 'pending', approved: 'approved', rejected: 'rejected' }[action];
  }

  actionLabel(action: RecentActivity['action']): string {
    return { submitted: 'Submitted', approved: 'Approved', rejected: 'Rejected' }[action];
  }
}
