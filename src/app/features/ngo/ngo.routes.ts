import { Routes } from '@angular/router';
import { NgoPortalComponent } from './ngo-portal.component';

export const NGO_ROUTES: Routes = [
  {
    path: '',
    component: NgoPortalComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/ngo-dashboard.component').then(m => m.NgoDashboardComponent),
      },
    ],
  },
];
