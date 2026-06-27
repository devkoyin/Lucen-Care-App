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
        data: { label: 'Community' },
        loadComponent: () =>
          import('./community/community-portal.component').then(m => m.CommunityPortalComponent),
        children: [
          { path: '', redirectTo: 'feed', pathMatch: 'full' },
          {
            path: 'feed',
            loadComponent: () =>
              import('./community/community.component').then(m => m.CommunityComponent),
          },
          {
            path: 'groups',
            loadComponent: () =>
              import('./community/groups-list/groups-list.component').then(m => m.GroupsListComponent),
          },
          {
            path: 'trending',
            loadComponent: () =>
              import('./community/trending/trending.component').then(m => m.TrendingComponent),
          },
          {
            path: 'group/:id',
            loadComponent: () =>
              import('./community/group/community-group.component').then(m => m.CommunityGroupComponent),
          },
        ],
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
