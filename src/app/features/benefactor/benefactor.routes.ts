import { Routes } from '@angular/router';
import { BenefactorPortalComponent } from './benefactor-portal.component';
import { verifiedGuard } from '../../core/auth/verified.guard';

export const BENEFACTOR_ROUTES: Routes = [
  {
    path: '',
    component: BenefactorPortalComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        canActivate: [verifiedGuard('benefactor', '/benefactor/pending')],
        loadComponent: () =>
          import('./dashboard/benefactor-dashboard.component').then(m => m.BenefactorDashboardComponent),
        children: [
          { path: '', redirectTo: 'threads', pathMatch: 'full' },
          {
            path: 'threads',
            loadComponent: () =>
              import('./dashboard/community-threads/community-threads.component').then(m => m.BenCommunityThreadsComponent),
          },
          {
            path: 'impact',
            loadComponent: () =>
              import('./dashboard/impact/impact.component').then(m => m.BenImpactComponent),
          },
          {
            path: 'contributions',
            loadComponent: () =>
              import('./dashboard/contributions/contributions.component').then(m => m.BenContributionsComponent),
          },
          {
            path: 'posts',
            loadComponent: () =>
              import('./dashboard/my-posts/my-posts.component').then(m => m.BenMyPostsComponent),
          },
        ],
      },
      {
        path: 'pending',
        loadComponent: () =>
          import('../../shared/components/pending-verification/pending-verification.component')
            .then(m => m.PendingVerificationComponent),
        data: { waitingMessage: "Our team is verifying your identity. You'll receive an activation email once your Verified Benefactor badge is granted." },
      },
      {
        path: 'community',
        canActivate: [verifiedGuard('benefactor', '/benefactor/pending')],
        loadComponent: () =>
          import('../patient/community/community.component').then(m => m.CommunityComponent),
      },
      {
        path: 'profile',
        canActivate: [verifiedGuard('benefactor', '/benefactor/pending')],
        loadComponent: () =>
          import('./profile/benefactor-profile.component').then(m => m.BenefactorProfileComponent),
      },
    ],
  },
];
