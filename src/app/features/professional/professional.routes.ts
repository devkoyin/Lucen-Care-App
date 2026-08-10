import { Routes } from '@angular/router';
import { ProfessionalPortalComponent } from './professional-portal.component';
import { verifiedGuard } from '../../core/auth/verified.guard';

export const PROFESSIONAL_ROUTES: Routes = [
  {
    path: '',
    component: ProfessionalPortalComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        canActivate: [verifiedGuard('professional', '/professional/pending')],
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
            path: 'posts',
            loadComponent: () =>
              import('./dashboard/my-posts/my-posts.component').then(m => m.ProMyPostsComponent),
          },
        ],
      },
      {
        path: 'pending',
        loadComponent: () =>
          import('../../shared/components/pending-verification/pending-verification.component')
            .then(m => m.PendingVerificationComponent),
        data: { waitingMessage: "Our team is verifying your credentials. You'll receive an activation email once approved." },
      },
      {
        path: 'community',
        canActivate: [verifiedGuard('professional', '/professional/pending')],
        // The full portal — feed, groups, trending, threads — not the bare feed
        // component this used to load out of the patient feature.
        data: { communityBase: '/professional/community' },
        loadChildren: () =>
          import('../community/community.routes').then(m => m.COMMUNITY_ROUTES),
      },
      {
        path: 'profile',
        canActivate: [verifiedGuard('professional', '/professional/pending')],
        loadComponent: () =>
          import('./profile/professional-profile.component').then(m => m.ProfessionalProfileComponent),
      },
    ],
  },
];
