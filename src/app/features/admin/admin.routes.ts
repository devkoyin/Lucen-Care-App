import { Routes } from '@angular/router';
import { AdminPortalComponent } from './admin-portal.component';
import { adminGuard } from '../../core/auth/admin.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./login/admin-login.component').then(m => m.AdminLoginComponent),
  },
  {
    path: '',
    component: AdminPortalComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
      },
      {
        path: 'ngo-approvals',
        loadComponent: () =>
          import('./ngo-approvals/ngo-approvals.component').then(m => m.NgoApprovalsComponent),
      },
      {
        path: 'hmo-approvals',
        loadComponent: () =>
          import('./hmo-approvals/hmo-approvals.component').then(m => m.HmoApprovalsComponent),
      },
      {
        path: 'professional-approvals',
        loadComponent: () =>
          import('./professional-approvals/professional-approvals.component').then(m => m.ProfessionalApprovalsComponent),
      },
      {
        path: 'benefactor-approvals',
        loadComponent: () =>
          import('./benefactor-approvals/benefactor-approvals.component').then(m => m.BenefactorApprovalsComponent),
      },
      {
        path: 'audit-log',
        loadComponent: () =>
          import('./audit-log/audit-log.component').then(m => m.AuditLogComponent),
      },
    ],
  },
];
