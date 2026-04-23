import { Routes } from '@angular/router';
import { PlaceholderComponent } from '../../shared/components/placeholder/placeholder.component';

export const PATIENT_ROUTES: Routes = [
  { path: '',          redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: PlaceholderComponent, data: { title: 'Patient Dashboard — Plan 3' } },
  { path: '**',        component: PlaceholderComponent },
];
