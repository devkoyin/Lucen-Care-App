import { Routes } from '@angular/router';
import { HmoPortalComponent } from './hmo-portal.component';
import { roleGuard } from '../../core/auth/role.guard';
import { verifiedGuard } from '../../core/auth/verified.guard';

export const HMO_ROUTES: Routes = [
  {
    path: '',
    component: HmoPortalComponent,
    canActivate: [roleGuard('hmo', ['/auth', 'hmo', 'login'])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        canActivate: [verifiedGuard('hmo', '/hmo/pending')],
        loadComponent: () =>
          import('./dashboard/hmo-dashboard.component').then(m => m.HmoDashboardComponent),
      },
      {
        path: 'pre-auth',
        canActivate: [verifiedGuard('hmo', '/hmo/pending')],
        data: { label: 'Pre-Auth' },
        loadComponent: () =>
          import('./pre-auth/pre-auth.component').then(m => m.PreAuthComponent),
      },
      {
        path: 'claims',
        canActivate: [verifiedGuard('hmo', '/hmo/pending')],
        data: { label: 'Claims' },
        loadComponent: () =>
          import('./claims/claims.component').then(m => m.ClaimsComponent),
      },
      {
        path: 'members',
        canActivate: [verifiedGuard('hmo', '/hmo/pending')],
        data: { label: 'Members' },
        loadComponent: () =>
          import('./members/members.component').then(m => m.MembersComponent),
      },
      {
        path: 'providers',
        canActivate: [verifiedGuard('hmo', '/hmo/pending')],
        data: { label: 'Providers' },
        loadComponent: () =>
          import('./providers/providers.component').then(m => m.ProvidersComponent),
      },
      {
        path: 'pending',
        loadComponent: () =>
          import('../../shared/components/pending-verification/pending-verification.component')
            .then(m => m.PendingVerificationComponent),
        data: { waitingMessage: "Our team is reviewing your application. You'll receive an activation email once approved." },
      },
    ],
  },
];
