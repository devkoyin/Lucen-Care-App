import { Routes } from '@angular/router';
import { ProfessionalPortalComponent } from './professional-portal.component';
import { professionalApprovedGuard } from '../../core/auth/professional-approved.guard';

export const PROFESSIONAL_ROUTES: Routes = [
  {
    path: '',
    component: ProfessionalPortalComponent,
    children: [
      { path: '', redirectTo: 'community', pathMatch: 'full' },
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
