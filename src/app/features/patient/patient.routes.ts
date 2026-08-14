import { Routes } from '@angular/router';
import { PatientPortalComponent } from './patient-portal.component';
import { roleGuard } from '../../core/auth/role.guard';
import { SettingsModule } from '../settings/settings.component';

const SETTINGS_MODULES: SettingsModule[] = [
  {
    icon: '🔒',
    label: 'Privacy & Sharing',
    description: 'Choose who can see your health information.',
    route: '/patient/settings/privacy',
  },
  {
    icon: '👤',
    label: 'My Profile',
    description: 'Your name, contact details and where you live.',
    route: '/patient/settings/profile',
  },
];

export const PATIENT_ROUTES: Routes = [
  {
    path: '',
    component: PatientPortalComponent,
    canActivate: [roleGuard('patient', ['/auth', 'patient', 'login'])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/patient-dashboard.component').then(m => m.PatientDashboardComponent),
      },
      // Both pages moved under `settings`. Kept as redirects so bookmarks and any
      // link still pointing at the old flat paths keep working.
      { path: 'profile', redirectTo: 'settings/profile', pathMatch: 'full' },
      { path: 'privacy', redirectTo: 'settings/privacy', pathMatch: 'full' },
      {
        // No component on the parent: children render straight into the portal's
        // outlet, so the landing is a sibling of the pages it links to rather than
        // a wrapper around them.
        path: 'settings',
        data: { label: 'Settings' },
        children: [
          {
            path: '',
            data: { modules: SETTINGS_MODULES },
            loadComponent: () =>
              import('../settings/settings.component').then(m => m.SettingsComponent),
          },
          {
            // The only place a patient can change their mind about sharing. Without it
            // a purpose declined at onboarding stayed declined forever.
            path: 'privacy',
            data: { label: 'Privacy' },
            loadComponent: () =>
              import('./consents/consents.component').then(m => m.PatientConsentsComponent),
          },
          {
            // Without an edit path, anything added to the patient record after someone
            // onboarded — location, most recently — could never be filled in.
            path: 'profile',
            data: { label: 'My Profile' },
            loadComponent: () =>
              import('./profile/patient-profile.component').then(m => m.PatientProfileComponent),
          },
        ],
      },
      {
        path: 'medications',
        data: { label: 'Medications' },
        loadComponent: () =>
          import('./medications/medications.component').then(m => m.MedicationsComponent),
        children: [
          { path: '', redirectTo: 'schedule', pathMatch: 'full' },
          {
            path: 'schedule',
            loadComponent: () =>
              import('./medications/schedule/schedule.component').then(m => m.MedScheduleComponent),
          },
          {
            path: 'refills',
            loadComponent: () =>
              import('./medications/refills/refills.component').then(m => m.MedRefillsComponent),
          },
          {
            path: 'all',
            loadComponent: () =>
              import('./medications/all-medications/all-medications.component').then(m => m.AllMedicationsComponent),
          },
        ],
      },
      {
        path: 'appointments',
        data: { label: 'Appointments' },
        loadComponent: () =>
          import('./appointments/appointments.component').then(m => m.AppointmentsComponent),
      },
      {
        path: 'ai-chat',
        data: { label: 'AI Health Chat' },
        loadComponent: () =>
          import('./ai-chat/ai-chat.component').then(m => m.AiChatComponent),
      },
      {
        path: 'community',
        // The community is role-neutral and shared with the professional and
        // benefactor portals — see features/community/community.routes.ts.
        data: { label: 'Community', communityBase: '/patient/community' },
        loadChildren: () =>
          import('../community/community.routes').then(m => m.COMMUNITY_ROUTES),
      },
      {
        path: 'funding',
        data: { label: 'Funding' },
        loadComponent: () =>
          import('./funding/funding.component').then(m => m.FundingComponent),
        children: [
          { path: '', redirectTo: 'available', pathMatch: 'full' },
          {
            path: 'available',
            loadComponent: () =>
              import('./funding/available-plans/available-plans.component').then(m => m.AvailablePlansComponent),
          },
          {
            path: 'plans',
            loadComponent: () =>
              import('./funding/active-plans/active-plans.component').then(m => m.ActivePlansComponent),
          },
        ],
      },
    ],
  },
];
