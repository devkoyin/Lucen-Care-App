import { Routes } from '@angular/router';
import { PlaceholderComponent } from '../../shared/components/placeholder/placeholder.component';

export const NGO_ROUTES: Routes = [
  { path: '',          redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: PlaceholderComponent, data: { title: 'NGO Dashboard — Plan 4' } },
  { path: '**',        component: PlaceholderComponent },
];
