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
      {
        path: 'medications',
        data: { label: 'Medications' },
        loadComponent: () =>
          import('./medications/medications.component').then(m => m.MedicationsComponent),
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
        data: { label: 'Community' },
        loadComponent: () =>
          import('./community/community.component').then(m => m.CommunityComponent),
      },
      {
        path: 'funding',
        data: { label: 'Funding' },
        loadComponent: () =>
          import('./funding/funding.component').then(m => m.FundingComponent),
      },
    ],
  },
];
