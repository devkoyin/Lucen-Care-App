import { Routes } from '@angular/router';
import { PlaceholderComponent } from '../../shared/components/placeholder/placeholder.component';

export const AUTH_ROUTES: Routes = [
  { path: ':role/login',  component: PlaceholderComponent, data: { title: 'Login — Plan 2' } },
  { path: ':role/signup', component: PlaceholderComponent, data: { title: 'Sign Up — Plan 2' } },
  { path: ':role/forgot-password', component: PlaceholderComponent },
  { path: 'verify-email', component: PlaceholderComponent },
  { path: 'onboarding/:role', component: PlaceholderComponent },
  { path: 'login', component: PlaceholderComponent, data: { title: 'Login — Plan 2' } },
];
