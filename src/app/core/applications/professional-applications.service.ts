import { Injectable, signal, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApplicationsService, AppDoc } from './applications.service';
import { ApiService } from '../api/api.service';

export type ProfessionalAppStatus = 'pending' | 'approved' | 'rejected';
export type Profession = 'Doctor' | 'Nurse' | 'Therapist' | 'Other';

export interface ProfessionalApplication {
  id: string;
  status: ProfessionalAppStatus;
  submittedAt: string;

  fullName: string;
  email: string;
  phone: string;
  profession: Profession;
  licenseNumber: string;
  specialty: string;
  yearsOfExperience: number;
  bio: string;

  docs: AppDoc[];
  rejectionReason?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

const PROF_APPS_KEY = 'lc_professional_applications';

@Injectable({ providedIn: 'root' })
export class ProfessionalApplicationsService {
  private readonly api = inject(ApiService);
  private readonly orgApps = inject(ApplicationsService);
  private readonly _applications = signal<ProfessionalApplication[]>(this.loadApps());

  readonly applications = this._applications.asReadonly();

  submit(app: Omit<ProfessionalApplication, 'id' | 'status' | 'submittedAt'>): void {
    const newApp: ProfessionalApplication = {
      ...app,
      id: `prof-${Date.now()}`,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    this.save([...this._applications(), newApp]);
    this.orgApps.addAudit({
      action: 'submitted',
      orgName: newApp.fullName,
      orgType: 'professional',
      applicationId: newApp.id,
      actor: 'System',
    });
  }

  approve(id: string, reviewedBy = 'Admin'): void {
    const app = this._applications().find(a => a.id === id);
    this.patch(id, { status: 'approved', reviewedBy, reviewedAt: new Date().toISOString() });
    if (app) {
      this.orgApps.addAudit({ action: 'approved', orgName: app.fullName, orgType: 'professional', applicationId: id, actor: reviewedBy });
    }
  }

  reject(id: string, reason: string, reviewedBy = 'Admin'): void {
    const app = this._applications().find(a => a.id === id);
    this.patch(id, { status: 'rejected', rejectionReason: reason, reviewedBy, reviewedAt: new Date().toISOString() });
    if (app) {
      this.orgApps.addAudit({ action: 'rejected', orgName: app.fullName, orgType: 'professional', applicationId: id, actor: reviewedBy, reason });
    }
  }

  submitToApi(payload: {
    profession: Profession; licenseNumber: string; specialty: string;
    yearsOfExperience: number; phone: string; bio: string;
    termsConsent: true; codeOfConductConsent: true;
  }): Observable<unknown> {
    return this.api.post<{ data: unknown }>('/auth/onboarding/professional', payload).pipe(map(r => r));
  }

  findByEmail(email: string): ProfessionalApplication | undefined {
    return this._applications().find(a => a.email === email);
  }

  updateBio(id: string, bio: string): void {
    this.patch(id, { bio });
  }

  private patch(id: string, changes: Partial<ProfessionalApplication>): void {
    this.save(this._applications().map(a => a.id === id ? { ...a, ...changes } : a));
  }

  private save(apps: ProfessionalApplication[]): void {
    this._applications.set(apps);
    localStorage.setItem(PROF_APPS_KEY, JSON.stringify(apps));
  }

  private loadApps(): ProfessionalApplication[] {
    try { return JSON.parse(localStorage.getItem(PROF_APPS_KEY) ?? '[]'); } catch { return []; }
  }
}
