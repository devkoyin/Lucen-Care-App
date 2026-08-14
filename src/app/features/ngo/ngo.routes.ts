import { Routes } from '@angular/router';
import { NgoPortalComponent } from './ngo-portal.component';
import { roleGuard } from '../../core/auth/role.guard';
import { verifiedGuard } from '../../core/auth/verified.guard';
import { SettingsModule } from '../settings/settings.component';

const SETTINGS_MODULES: SettingsModule[] = [
  {
    icon: '🏢',
    label: 'Organisation Profile',
    description: 'Your registration details, focus areas and verification status.',
    route: '/ngo/settings/profile',
  },
];

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
        // Same component in edit mode: one form, one set of validators, one payload
        // mapper. Also declared before the bare 'programs' route.
        path: 'programs/:id/edit',
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
        // Guard sits on the parent so it covers the landing page and every module
        // added under it later, not just the one child that exists today.
        path: 'settings',
        canActivate: [verifiedGuard('ngo', '/ngo/pending')],
        data: { label: 'Settings' },
        children: [
          {
            path: '',
            data: { modules: SETTINGS_MODULES },
            loadComponent: () =>
              import('../settings/settings.component').then(m => m.SettingsComponent),
          },
          {
            // Nine fields are collected at onboarding and were never shown back to
            // the organisation afterwards. /auth/me already carries all of them.
            path: 'profile',
            data: { label: 'Organisation Profile' },
            loadComponent: () =>
              import('./profile/ngo-profile.component').then(m => m.NgoProfileComponent),
          },
        ],
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
