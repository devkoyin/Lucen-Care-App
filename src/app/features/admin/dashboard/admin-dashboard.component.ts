import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApplicationsService, AuditEntry } from '../../../core/applications/applications.service';
import { ProfessionalApplicationsService } from '../../../core/applications/professional-applications.service';
import { BenefactorApplicationsService } from '../../../core/applications/benefactor-applications.service';
import { ProgramApprovalsService } from '../../../core/programs/program-approvals.service';
import { CommunityModerationService } from '../../../core/community/community-moderation.service';
import {
  auditActionLabel,
  auditActionTone,
  auditSubjectLabel,
  auditTimeAgo,
  AuditAction,
  AuditSubjectType,
} from '../../../core/applications/audit-labels';

interface StatCard {
  label: string;
  value: number;
  accent?: boolean;
}

@Component({
  selector: 'lc-admin-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private readonly appsService = inject(ApplicationsService);
  private readonly professionalService = inject(ProfessionalApplicationsService);
  private readonly benefactorService = inject(BenefactorApplicationsService);
  private readonly programApprovals = inject(ProgramApprovalsService);
  private readonly moderation = inject(CommunityModerationService);

  ngOnInit(): void {
    this.appsService.load().subscribe({ error: () => {} });
    this.appsService.loadRecentActivity().subscribe({ error: () => {} });
    // Plain load(), not load('pending') — the approvals pages share these signals,
    // and leaving a pending-only list behind would hide their approved/rejected tabs.
    this.professionalService.load().subscribe({ error: () => {} });
    this.benefactorService.load().subscribe({ error: () => {} });
    this.programApprovals.load().subscribe({ error: () => {} });
    this.moderation.load().subscribe({ error: () => {} });
  }

  /** Real audit events from GET /admin/audit, newest first. */
  readonly activity = this.appsService.recentActivity;

  readonly professionalPendingCount = computed(
    () => this.professionalService.applications().filter(a => a.status === 'pending').length,
  );

  readonly benefactorPendingCount = computed(
    () => this.benefactorService.applications().filter(a => a.status === 'pending').length,
  );

  get stats(): StatCard[] {
    return [
      { label: 'Pending NGOs',          value: this.appsService.pendingCount('ngo'), accent: true },
      { label: 'Pending HMOs',          value: this.appsService.pendingCount('hmo'), accent: true },
      { label: 'Pending Professionals', value: this.professionalPendingCount(), accent: true },
      { label: 'Pending Benefactors',   value: this.benefactorPendingCount(), accent: true },
      { label: 'Pending Programmes',    value: this.programApprovals.pendingCount(), accent: true },
      { label: 'Community Reports',     value: this.moderation.pendingCount(), accent: true },
      { label: 'Approved (30d)',        value: this.appsService.recentCount('approved', 30) },
      { label: 'Rejected (30d)',        value: this.appsService.recentCount('rejected', 30) },
    ];
  }

  get ngoPendingCount(): number { return this.appsService.pendingCount('ngo'); }
  get hmoPendingCount(): number { return this.appsService.pendingCount('hmo'); }
  get programPendingCount(): number { return this.programApprovals.pendingCount(); }

  trackEntry(_: number, entry: AuditEntry): string { return entry.id; }

  actionClass(action: AuditAction): string { return auditActionTone(action); }
  actionLabel(action: AuditAction): string { return auditActionLabel(action); }
  typeLabel(type: AuditSubjectType): string { return auditSubjectLabel(type); }
  timeAgo(iso: string): string { return auditTimeAgo(iso); }
}
