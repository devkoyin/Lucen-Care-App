import { Injectable, signal } from '@angular/core';

export type OrgType    = 'ngo' | 'hmo';
export type AuditSubjectType = OrgType | 'professional' | 'benefactor';
export type AppStatus  = 'pending' | 'approved' | 'rejected';
export type AuditAction = 'submitted' | 'approved' | 'rejected';

export interface AppDoc {
  label: string;
  submitted: boolean;
}

export interface OrgApplication {
  id: string;
  type: OrgType;
  status: AppStatus;
  submittedAt: string;

  // Contact
  contactPerson: string;
  email: string;

  // Common
  orgName: string;

  // NGO-specific
  registrationNo?: string;
  focusAreas?: string;
  website?: string;
  operatingRegions?: string;
  headOfficeCountry?: string;
  programDescription?: string;

  // HMO-specific
  licenceNo?: string;
  contactPhone?: string;
  coverageRegion?: string;
  enrolledPatientCount?: string;
  specialtyFocus?: string;

  // Document checklist
  docs: AppDoc[];

  // Review
  rejectionReason?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface AuditEntry {
  id: string;
  action: AuditAction;
  orgName: string;
  orgType: AuditSubjectType;
  applicationId: string;
  actor: string;
  timestamp: string;
  reason?: string;
}

const APPS_KEY  = 'lc_applications';
const AUDIT_KEY = 'lc_audit_log';

@Injectable({ providedIn: 'root' })
export class ApplicationsService {
  private readonly _applications = signal<OrgApplication[]>(this.loadApps());
  private readonly _auditLog     = signal<AuditEntry[]>(this.loadAudit());

  readonly applications = this._applications.asReadonly();
  readonly auditLog     = this._auditLog.asReadonly();

  submit(app: Omit<OrgApplication, 'id' | 'status' | 'submittedAt'>): void {
    const newApp: OrgApplication = {
      ...app,
      id: `app-${Date.now()}`,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    const updated = [...this._applications(), newApp];
    this._applications.set(updated);
    this.saveApps(updated);
    this.addAudit({
      action: 'submitted',
      orgName: newApp.orgName,
      orgType: newApp.type,
      applicationId: newApp.id,
      actor: 'System',
    });
  }

  approve(id: string, reviewedBy = 'Admin'): void {
    const app = this._applications().find(a => a.id === id);
    this.patch(id, { status: 'approved', reviewedBy, reviewedAt: new Date().toISOString() });
    if (app) {
      this.addAudit({ action: 'approved', orgName: app.orgName, orgType: app.type, applicationId: id, actor: reviewedBy });
    }
  }

  reject(id: string, reason: string, reviewedBy = 'Admin'): void {
    const app = this._applications().find(a => a.id === id);
    this.patch(id, { status: 'rejected', rejectionReason: reason, reviewedBy, reviewedAt: new Date().toISOString() });
    if (app) {
      this.addAudit({ action: 'rejected', orgName: app.orgName, orgType: app.type, applicationId: id, actor: reviewedBy, reason });
    }
  }

  byType(type: OrgType): OrgApplication[] {
    return this._applications().filter(a => a.type === type);
  }

  pendingCount(type?: OrgType): number {
    return this._applications().filter(
      a => a.status === 'pending' && (!type || a.type === type)
    ).length;
  }

  recentCount(status: AppStatus, days = 30): number {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return this._applications().filter(
      a => a.status === status && new Date(a.submittedAt).getTime() >= cutoff
    ).length;
  }

  addAudit(entry: Omit<AuditEntry, 'id' | 'timestamp'>): void {
    const newEntry: AuditEntry = { ...entry, id: `audit-${Date.now()}`, timestamp: new Date().toISOString() };
    const updated = [newEntry, ...this._auditLog()];
    this._auditLog.set(updated);
    this.saveAudit(updated);
  }

  private patch(id: string, changes: Partial<OrgApplication>): void {
    const updated = this._applications().map(a => a.id === id ? { ...a, ...changes } : a);
    this._applications.set(updated);
    this.saveApps(updated);
  }

  private saveApps(apps: OrgApplication[]): void {
    localStorage.setItem(APPS_KEY, JSON.stringify(apps));
  }

  private saveAudit(log: AuditEntry[]): void {
    localStorage.setItem(AUDIT_KEY, JSON.stringify(log));
  }

  private loadApps(): OrgApplication[] {
    try { return JSON.parse(localStorage.getItem(APPS_KEY) ?? '[]'); } catch { return []; }
  }

  private loadAudit(): AuditEntry[] {
    try { return JSON.parse(localStorage.getItem(AUDIT_KEY) ?? '[]'); } catch { return []; }
  }
}
