import { Component, inject, signal, computed } from '@angular/core';
import { ApplicationsService, AuditEntry, AuditAction, OrgType } from '../../../core/applications/applications.service';

type FilterTab = 'all' | AuditAction;

@Component({
  selector: 'lc-audit-log',
  standalone: true,
  templateUrl: './audit-log.component.html',
  styleUrl: './audit-log.component.scss',
})
export class AuditLogComponent {
  private readonly appsService = inject(ApplicationsService);

  readonly tabs: { id: FilterTab; label: string }[] = [
    { id: 'all',       label: 'All Events' },
    { id: 'submitted', label: 'Submissions' },
    { id: 'approved',  label: 'Approvals' },
    { id: 'rejected',  label: 'Rejections' },
  ];

  readonly activeTab = signal<FilterTab>('all');
  readonly search    = signal('');

  get filtered(): AuditEntry[] {
    const tab    = this.activeTab();
    const query  = this.search().toLowerCase().trim();
    let entries  = this.appsService.auditLog();

    if (tab !== 'all') {
      entries = entries.filter(e => e.action === tab);
    }
    if (query) {
      entries = entries.filter(e =>
        e.orgName.toLowerCase().includes(query) ||
        e.actor.toLowerCase().includes(query)
      );
    }
    return entries;
  }

  countFor(tab: FilterTab): number {
    const all = this.appsService.auditLog();
    return tab === 'all' ? all.length : all.filter(e => e.action === tab).length;
  }

  setTab(tab: FilterTab): void { this.activeTab.set(tab); }

  actionLabel(action: AuditAction): string {
    return { submitted: 'Submitted', approved: 'Approved', rejected: 'Rejected' }[action];
  }

  typeLabel(type: OrgType): string {
    return type === 'ngo' ? 'NGO' : 'HMO';
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit',
    });
  }

  timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins < 1)   return 'Just now';
    if (mins < 60)  return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7)   return `${days}d ago`;
    return this.formatDate(iso);
  }
}
