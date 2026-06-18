import { Routes } from '@angular/router';
import { BenefactorPortalComponent } from './benefactor-portal.component';
import { benefactorApprovedGuard } from '../../core/auth/benefactor-approved.guard';

export const BENEFACTOR_ROUTES: Routes = [
  {
    path: '',
    component: BenefactorPortalComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        canActivate: [benefactorApprovedGuard],
        loadComponent: () =>
          import('./dashboard/benefactor-dashboard.component').then(m => m.BenefactorDashboardComponent),
      },
      {
        path: 'pending',
        loadComponent: () =>
          import('./pending/benefactor-pending.component').then(m => m.BenefactorPendingComponent),
      },
      {
        path: 'community',
        canActivate: [benefactorApprovedGuard],
        loadComponent: () =>
          import('../patient/community/community.component').then(m => m.CommunityComponent),
      },
      {
        path: 'profile',
        canActivate: [benefactorApprovedGuard],
        loadComponent: () =>
          import('./profile/benefactor-profile.component').then(m => m.BenefactorProfileComponent),
      },
    ],
  },
];
