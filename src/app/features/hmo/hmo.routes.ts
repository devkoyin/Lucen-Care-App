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
    ],
  },
];
