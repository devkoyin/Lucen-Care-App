import { Component, OnInit, inject, signal } from '@angular/core';
import { ApplicationsService, AuditEntry } from '../../../core/applications/applications.service';
import {
  auditActionLabel,
  auditActionTone,
  auditDate,
  auditSubjectLabel,
  auditTime,
  auditTimeAgo,
  AuditAction,
  AuditSubjectType,
} from '../../../core/applications/audit-labels';

/** Only the three review actions get their own tab; the rest live under "All". */
type FilterTab = 'all' | 'submitted' | 'approved' | 'rejected';

@Component({
  selector: 'lc-audit-log',
  standalone: true,
  templateUrl: './audit-log.component.html',
  styleUrl: './audit-log.component.scss',
})
export class AuditLogComponent implements OnInit {
  private readonly appsService = inject(ApplicationsService);

  ngOnInit(): void {
    this.appsService.loadAuditLog().subscribe({ error: () => {} });
  }

  readonly tabs: { id: FilterTab; label: string }[] = [
    { id: 'all',       label: 'All Events' },
    { id: 'submitted', label: 'Submissions' },
    { id: 'approved',  label: 'Approvals' },
    { id: 'rejected',  label: 'Rejections' },
  ];

  readonly activeTab = signal<FilterTab>('all');
  readonly search    = signal('');
  readonly loading   = this.appsService.auditLoading;
  readonly cursor    = this.appsService.auditCursor;

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

  /**
   * Counts are over the rows loaded so far, not the whole table — they can only be
   * computed from rows we hold, which is also why the tabs filter client-side rather
   * than re-querying with the API's `action` param.
   */
  countFor(tab: FilterTab): number {
    const all = this.appsService.auditLog();
    return tab === 'all' ? all.length : all.filter(e => e.action === tab).length;
  }

  setTab(tab: FilterTab): void { this.activeTab.set(tab); }

  loadMore(): void {
    const cursor = this.cursor();
    if (!cursor || this.loading()) return;
    this.appsService.loadAuditLog({ cursor }).subscribe({ error: () => {} });
  }

  actionLabel(action: AuditAction): string { return auditActionLabel(action); }
  actionTone(action: AuditAction): string { return auditActionTone(action); }
  typeLabel(type: AuditSubjectType): string { return auditSubjectLabel(type); }
  formatDate(iso: string): string { return auditDate(iso); }
  formatTime(iso: string): string { return auditTime(iso); }
  timeAgo(iso: string): string { return auditTimeAgo(iso); }
}
