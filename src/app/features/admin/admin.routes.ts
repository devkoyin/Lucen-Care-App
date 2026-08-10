import { Routes } from '@angular/router';
import { AdminPortalComponent } from './admin-portal.component';
import { adminGuard } from '../../core/auth/admin.guard';
import { verifiedGuard } from '../../core/auth/verified.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./login/admin-login.component').then(m => m.AdminLoginComponent),
  },
  {
    path: '',
    component: AdminPortalComponent,
    // adminGuard is the cheap synchronous reject for anonymous visitors; verifiedGuard is
    // the one that matters — it asks the API rather than trusting the role cached in
    // localStorage, which anyone can edit. Safe on the parent here because the redirect
    // target is a sibling route, not a child, so there is nothing to loop on.
    canActivate: [adminGuard, verifiedGuard('admin', '/admin/login')],
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
        // Programmes were the one reviewable thing with no admin screen, so an NGO's
        // submission could never be approved and never reached a patient.
        path: 'program-approvals',
        loadComponent: () =>
          import('./program-approvals/program-approvals.component').then(m => m.ProgramApprovalsComponent),
      },
      {
        // Reporting existed on the client with nowhere for a report to land. This
        // is where they land.
        path: 'community-reports',
        loadComponent: () =>
          import('./community-moderation/community-moderation.component').then(m => m.CommunityModerationComponent),
      },
      {
        path: 'audit-log',
        loadComponent: () =>
          import('./audit-log/audit-log.component').then(m => m.AuditLogComponent),
      },
    ],
  },
];
