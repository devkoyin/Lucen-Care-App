import { Injectable, signal, inject } from '@angular/core';
import { ApplicationsService, AppDoc } from './applications.service';

export type BenefactorAppStatus = 'pending' | 'approved' | 'rejected';

export interface BenefactorApplication {
  id: string;
  status: BenefactorAppStatus;
  submittedAt: string;

  fullName: string;
  email: string;
  phone: string;
  reasonForSupport: string;

  docs: AppDoc[];
  rejectionReason?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

const BENEF_APPS_KEY = 'lc_benefactor_applications';

@Injectable({ providedIn: 'root' })
export class BenefactorApplicationsService {
  private readonly orgApps = inject(ApplicationsService);
  private readonly _applications = signal<BenefactorApplication[]>(this.loadApps());

  readonly applications = this._applications.asReadonly();

  submit(app: Omit<BenefactorApplication, 'id' | 'status' | 'submittedAt'>): void {
    const newApp: BenefactorApplication = {
      ...app,
      id: `benef-${Date.now()}`,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    this.save([...this._applications(), newApp]);
    this.orgApps.addAudit({
      action: 'submitted',
      orgName: newApp.fullName,
      orgType: 'benefactor',
      applicationId: newApp.id,
      actor: 'System',
    });
  }

  approve(id: string, reviewedBy = 'Admin'): void {
    const app = this._applications().find(a => a.id === id);
    this.patch(id, { status: 'approved', reviewedBy, reviewedAt: new Date().toISOString() });
    if (app) {
      this.orgApps.addAudit({ action: 'approved', orgName: app.fullName, orgType: 'benefactor', applicationId: id, actor: reviewedBy });
    }
  }

  reject(id: string, reason: string, reviewedBy = 'Admin'): void {
    const app = this._applications().find(a => a.id === id);
    this.patch(id, { status: 'rejected', rejectionReason: reason, reviewedBy, reviewedAt: new Date().toISOString() });
    if (app) {
      this.orgApps.addAudit({ action: 'rejected', orgName: app.fullName, orgType: 'benefactor', applicationId: id, actor: reviewedBy, reason });
    }
  }

  findByEmail(email: string): BenefactorApplication | undefined {
    return this._applications().find(a => a.email === email);
  }

  private patch(id: string, changes: Partial<BenefactorApplication>): void {
    this.save(this._applications().map(a => a.id === id ? { ...a, ...changes } : a));
  }

  private save(apps: BenefactorApplication[]): void {
    this._applications.set(apps);
    localStorage.setItem(BENEF_APPS_KEY, JSON.stringify(apps));
  }

  private loadApps(): BenefactorApplication[] {
    try { return JSON.parse(localStorage.getItem(BENEF_APPS_KEY) ?? '[]'); } catch { return []; }
  }
}
