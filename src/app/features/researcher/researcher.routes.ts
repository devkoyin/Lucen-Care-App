import { Routes } from '@angular/router';
import { ResearcherPortalComponent } from './researcher-portal.component';

export const RESEARCHER_ROUTES: Routes = [
  {
    path: '',
    component: ResearcherPortalComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/researcher-dashboard.component').then(m => m.ResearcherDashboardComponent),
      },
    ],
  },
];
