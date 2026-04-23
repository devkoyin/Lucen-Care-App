import { Routes } from '@angular/router';
import { PublicShellComponent } from '../../shared/layout/public-shell/public-shell.component';

export const PUBLIC_ROUTES: Routes = [
  {
    path: '',
    component: PublicShellComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./landing/landing.component').then(m => m.LandingComponent),
      },
      {
        path: 'select-role',
        loadComponent: () =>
          import('./role-selection/role-selection.component').then(m => m.RoleSelectionComponent),
      },
    ],
  },
];
