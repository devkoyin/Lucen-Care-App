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
      {
        path: 'programs',
        loadComponent: () =>
          import('./programs/programs.component').then(m => m.ProgramsComponent),
      },
      {
        path: 'applicants',
        loadComponent: () =>
          import('./applicants/applicants.component').then(m => m.ApplicantsComponent),
      },
      {
        path: 'map',
        loadComponent: () =>
          import('./map/patient-map.component').then(m => m.PatientMapComponent),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./notifications/notifications.component').then(m => m.NotificationsComponent),
      },
    ],
  },
];
