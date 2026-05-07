import { Routes } from '@angular/router';
import { PublicShellComponent } from '../../shared/layout/public-shell/public-shell.component';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    component: PublicShellComponent,
    children: [
      {
        path: ':role/login',
        loadComponent: () =>
          import('./login/login.component').then(m => m.LoginComponent),
      },
      {
        path: ':role/signup',
        loadComponent: () =>
          import('./signup/signup.component').then(m => m.SignupComponent),
      },
      {
        path: ':role/forgot-password',
        loadComponent: () =>
          import('./login/login.component').then(m => m.LoginComponent),
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./login/login.component').then(m => m.LoginComponent),
      },
      {
        path: 'verify-email',
        loadComponent: () =>
          import('./signup/signup.component').then(m => m.SignupComponent),
      },
    ],
  },
  {
    path: 'onboarding/patient',
    loadComponent: () =>
      import('./onboarding/patient/patient-onboarding.component').then(m => m.PatientOnboardingComponent),
  },
  {
    path: 'onboarding/ngo',
    loadComponent: () =>
      import('./onboarding/ngo/ngo-onboarding.component').then(m => m.NgoOnboardingComponent),
  },
  {
    path: 'onboarding/hmo',
    loadComponent: () =>
      import('./onboarding/hmo/hmo-onboarding.component').then(m => m.HmoOnboardingComponent),
  },
  {
    path: 'onboarding/researcher',
    loadComponent: () =>
      import('./onboarding/researcher/researcher-onboarding.component').then(m => m.ResearcherOnboardingComponent),
  },
];
