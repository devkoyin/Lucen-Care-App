import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./features/public/public.routes').then(m => m.PUBLIC_ROUTES),
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  {
    path: 'patient',
    loadChildren: () =>
      import('./features/patient/patient.routes').then(m => m.PATIENT_ROUTES),
  },
  {
    path: 'ngo',
    loadChildren: () =>
      import('./features/ngo/ngo.routes').then(m => m.NGO_ROUTES),
  },
  {
    path: 'hmo',
    loadChildren: () =>
      import('./features/hmo/hmo.routes').then(m => m.HMO_ROUTES),
  },
  {
    path: 'professional',
    loadChildren: () =>
      import('./features/professional/professional.routes').then(m => m.PROFESSIONAL_ROUTES),
  },
  {
    path: 'benefactor',
    loadChildren: () =>
      import('./features/benefactor/benefactor.routes').then(m => m.BENEFACTOR_ROUTES),
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
