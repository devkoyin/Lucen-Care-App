import { Routes } from '@angular/router';
import { BenefactorPortalComponent } from './benefactor-portal.component';
import { verifiedGuard } from '../../core/auth/verified.guard';
import { SettingsModule } from '../settings/settings.component';

const SETTINGS_MODULES: SettingsModule[] = [
  {
    icon: '💛',
    label: 'My Profile',
    description: 'Your details and identity verification.',
    route: '/benefactor/settings/profile',
  },
];

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
        // The full portal — feed, groups, trending, threads — not the bare feed
        // component this used to load out of the patient feature.
        data: { communityBase: '/benefactor/community' },
        loadChildren: () =>
          import('../community/community.routes').then(m => m.COMMUNITY_ROUTES),
      },
      { path: 'profile', redirectTo: 'settings/profile', pathMatch: 'full' },
      {
        // Guard sits on the parent so it covers the landing page and every module
        // added under it later, not just the one child that exists today.
        path: 'settings',
        canActivate: [verifiedGuard('benefactor', '/benefactor/pending')],
        data: { label: 'Settings' },
        children: [
          {
            path: '',
            data: { modules: SETTINGS_MODULES },
            loadComponent: () =>
              import('../settings/settings.component').then(m => m.SettingsComponent),
          },
          {
            path: 'profile',
            data: { label: 'My Profile' },
            loadComponent: () =>
              import('./profile/benefactor-profile.component').then(m => m.BenefactorProfileComponent),
          },
        ],
      },
    ],
  },
];
