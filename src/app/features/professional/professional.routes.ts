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
        children: [
          { path: '', redirectTo: 'threads', pathMatch: 'full' },
          {
            path: 'threads',
            loadComponent: () =>
              import('./dashboard/patient-threads/patient-threads.component').then(m => m.ProPatientThreadsComponent),
          },
          {
            path: 'impact',
            loadComponent: () =>
              import('./dashboard/impact/impact.component').then(m => m.ProImpactComponent),
          },
          {
            path: 'expertise',
            loadComponent: () =>
              import('./dashboard/expertise/expertise.component').then(m => m.ProExpertiseComponent),
          },
          {
            path: 'posts',
            loadComponent: () =>
              import('./dashboard/my-posts/my-posts.component').then(m => m.ProMyPostsComponent),
          },
        ],
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
