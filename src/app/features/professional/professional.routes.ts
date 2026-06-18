import { Routes } from '@angular/router';
import { ProfessionalPortalComponent } from './professional-portal.component';
import { professionalApprovedGuard } from '../../core/auth/professional-approved.guard';

export const PROFESSIONAL_ROUTES: Routes = [
  {
    path: '',
    component: ProfessionalPortalComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        canActivate: [professionalApprovedGuard],
        loadComponent: () =>
          import('./dashboard/professional-dashboard.component').then(m => m.ProfessionalDashboardComponent),
      },
      {
        path: 'pending',
        loadComponent: () =>
          import('./pending/professional-pending.component').then(m => m.ProfessionalPendingComponent),
      },
      {
        path: 'community',
        canActivate: [professionalApprovedGuard],
        loadComponent: () =>
          import('../patient/community/community.component').then(m => m.CommunityComponent),
      },
      {
        path: 'profile',
        canActivate: [professionalApprovedGuard],
        loadComponent: () =>
          import('./profile/professional-profile.component').then(m => m.ProfessionalProfileComponent),
      },
    ],
  },
];
