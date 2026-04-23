import { Routes } from '@angular/router';
import { PlaceholderComponent } from '../../shared/components/placeholder/placeholder.component';

export const RESEARCHER_ROUTES: Routes = [
  { path: '',          redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: PlaceholderComponent, data: { title: 'Researcher Dashboard — Plan 6' } },
  { path: '**',        component: PlaceholderComponent },
];
