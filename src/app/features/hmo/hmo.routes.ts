import { Routes } from '@angular/router';
import { PlaceholderComponent } from '../../shared/components/placeholder/placeholder.component';

export const HMO_ROUTES: Routes = [
  { path: '',          redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: PlaceholderComponent, data: { title: 'HMO Dashboard — Plan 5' } },
  { path: '**',        component: PlaceholderComponent },
];
