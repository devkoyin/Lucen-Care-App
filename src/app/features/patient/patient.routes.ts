import { Routes } from '@angular/router';
import { PatientPortalComponent } from './patient-portal.component';

export const PATIENT_ROUTES: Routes = [
  {
    path: '',
    component: PatientPortalComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/patient-dashboard.component').then(m => m.PatientDashboardComponent),
      },
    ],
  },
];
