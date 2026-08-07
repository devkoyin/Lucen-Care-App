import { Routes } from '@angular/router';
import { NgoPortalComponent } from './ngo-portal.component';
import { roleGuard } from '../../core/auth/role.guard';
import { verifiedGuard } from '../../core/auth/verified.guard';

export const NGO_ROUTES: Routes = [
  {
    path: '',
    component: NgoPortalComponent,
    canActivate: [roleGuard('ngo', ['/auth', 'ngo', 'login'])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        canActivate: [verifiedGuard('ngo', '/ngo/pending')],
        loadComponent: () =>
          import('./dashboard/ngo-dashboard.component').then(m => m.NgoDashboardComponent),
      },
      {
        // Declared before 'programs' so the more specific path wins. This route did
        // not exist, so the dashboard's "+ New Program" CTA fell through the app's
        // ** wildcard and ejected the NGO admin onto the public landing page.
        path: 'programs/create',
        canActivate: [verifiedGuard('ngo', '/ngo/pending')],
        loadComponent: () =>
          import('./programs/create-program.component').then(m => m.CreateProgramComponent),
      },
      {
        path: 'programs',
        canActivate: [verifiedGuard('ngo', '/ngo/pending')],
        loadComponent: () =>
          import('./programs/programs.component').then(m => m.ProgramsComponent),
      },
      {
        path: 'applicants',
        canActivate: [verifiedGuard('ngo', '/ngo/pending')],
        loadComponent: () =>
          import('./applicants/applicants.component').then(m => m.ApplicantsComponent),
      },
      {
        path: 'map',
        canActivate: [verifiedGuard('ngo', '/ngo/pending')],
        loadComponent: () =>
          import('./map/patient-map.component').then(m => m.PatientMapComponent),
      },
      {
        path: 'notifications',
        canActivate: [verifiedGuard('ngo', '/ngo/pending')],
        loadComponent: () =>
          import('./notifications/notifications.component').then(m => m.NotificationsComponent),
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
