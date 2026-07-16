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
