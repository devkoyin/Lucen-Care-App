import { Component, inject, signal } from '@angular/core';
import {
  ProfessionalApplicationsService,
  ProfessionalApplication,
  ProfessionalAppStatus,
} from '../../../core/applications/professional-applications.service';
import { AuthService } from '../../../core/auth/auth.service';

type FilterTab = 'all' | ProfessionalAppStatus;

@Component({
  selector: 'lc-professional-approvals',
  standalone: true,
  templateUrl: './professional-approvals.component.html',
  styleUrl: './professional-approvals.component.scss',
})
export class ProfessionalApprovalsComponent {
  private readonly appsService = inject(ProfessionalApplicationsService);
  private readonly auth        = inject(AuthService);

  readonly tabs: { id: FilterTab; label: string }[] = [
    { id: 'all',      label: 'All' },
    { id: 'pending',  label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
  ];

  readonly activeTab    = signal<FilterTab>('all');
  readonly expandedId   = signal<string | null>(null);
  readonly rejectingId  = signal<string | null>(null);
  readonly rejectReason = signal('');

  get filtered(): ProfessionalApplication[] {
    const tab  = this.activeTab();
    const list = this.appsService.applications();
    return tab === 'all' ? list : list.filter(a => a.status === tab);
  }

  countFor(tab: FilterTab): number {
    const list = this.appsService.applications();
    return tab === 'all' ? list.length : list.filter(a => a.status === tab).length;
  }

  setTab(tab: FilterTab): void { this.activeTab.set(tab); }

  toggleExpand(id: string): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  approve(id: string): void {
    this.appsService.approve(id, this.auth.user()?.name ?? 'Admin');
    this.expandedId.set(null);
  }

  startReject(id: string): void {
    this.rejectingId.set(id);
    this.rejectReason.set('');
  }

  confirmReject(id: string): void {
    this.appsService.reject(id, this.rejectReason(), this.auth.user()?.name ?? 'Admin');
    this.rejectingId.set(null);
    this.expandedId.set(null);
  }

  cancelReject(): void { this.rejectingId.set(null); }

  docsComplete(app: ProfessionalApplication): boolean {
    return app.docs.every(d => d.submitted);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
