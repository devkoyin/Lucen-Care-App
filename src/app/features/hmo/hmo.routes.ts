import { Routes } from '@angular/router';
import { HmoPortalComponent } from './hmo-portal.component';

export const HMO_ROUTES: Routes = [
  {
    path: '',
    component: HmoPortalComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/hmo-dashboard.component').then(m => m.HmoDashboardComponent),
      },
      {
        path: 'pre-auth',
        data: { label: 'Pre-Auth' },
        loadComponent: () =>
          import('./pre-auth/pre-auth.component').then(m => m.PreAuthComponent),
      },
      {
        path: 'claims',
        data: { label: 'Claims' },
        loadComponent: () =>
          import('./claims/claims.component').then(m => m.ClaimsComponent),
      },
      {
        path: 'members',
        data: { label: 'Members' },
        loadComponent: () =>
          import('./members/members.component').then(m => m.MembersComponent),
      },
      {
        path: 'providers',
        data: { label: 'Providers' },
        loadComponent: () =>
          import('./providers/providers.component').then(m => m.ProvidersComponent),
      },
    ],
  },
];
