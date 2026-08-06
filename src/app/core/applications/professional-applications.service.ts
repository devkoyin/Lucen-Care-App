import { Injectable, signal, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AppDoc } from './applications.service';
import { ApiService } from '../api/api.service';
import { Profession, ProfessionalOnboardingPayload } from '../auth/auth.models';

export type ProfessionalAppStatus = 'pending' | 'approved' | 'rejected';
export type { Profession };

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

/** Shape returned by GET /admin/applications/professional. */
interface ApiProfessionalApplication {
  id: string;
  userId: string;
  status: ProfessionalAppStatus;
  submittedAt: string;
  /** Joined from users — the application table has no name or email column. */
  name?: string;
  email: string;
  phone: string;
  profession: Profession;
  licenseNumber: string;
  specialty: string;
  yearsOfExperience: number;
  bio: string;
  rejectionReason?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

function toProfessionalApplication(a: ApiProfessionalApplication): ProfessionalApplication {
  return {
    id: a.id,
    status: a.status,
    submittedAt: a.submittedAt,
    fullName: a.name ?? a.email,
    email: a.email,
    phone: a.phone,
    profession: a.profession,
    licenseNumber: a.licenseNumber,
    specialty: a.specialty,
    yearsOfExperience: a.yearsOfExperience,
    bio: a.bio,
    // Derived client-side — the API stores the values, not a checklist.
    docs: [
      { label: 'License Number',      submitted: !!a.licenseNumber },
      { label: 'Specialty',           submitted: !!a.specialty },
      { label: 'Years of Experience', submitted: a.yearsOfExperience != null },
      { label: 'Professional Bio',    submitted: !!a.bio },
    ],
    rejectionReason: a.rejectionReason,
    reviewedAt: a.reviewedAt,
    reviewedBy: a.reviewedBy,
  };
}

@Injectable({ providedIn: 'root' })
export class ProfessionalApplicationsService {
  private readonly api = inject(ApiService);
  private readonly _applications = signal<ProfessionalApplication[]>([]);
  private readonly _loading = signal(false);

  readonly applications = this._applications.asReadonly();
  readonly loading = this._loading.asReadonly();

  /** GET /admin/applications/professional — platform admin only. */
  load(status?: ProfessionalAppStatus): Observable<ProfessionalApplication[]> {
    this._loading.set(true);
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.api
      .getData<ApiProfessionalApplication[]>('/admin/applications/professional', params)
      .pipe(
        map(rows => rows.map(toProfessionalApplication)),
        tap({
          next: apps => { this._applications.set(apps); this._loading.set(false); },
          error: () => this._loading.set(false),
        }),
      );
  }

  // Application review uses ReviewApplicationDto — { action, reason } — which is
  // a DIFFERENT shape from the organization review endpoint's { status, reason }.
  approve(id: string): Observable<unknown> {
    return this.api
      .patchData<unknown>(`/admin/applications/professional/${id}/review`, { action: 'approve' })
      .pipe(tap(() => this.load().subscribe({ error: () => {} })));
  }

  reject(id: string, reason: string): Observable<unknown> {
    return this.api
      .patchData<unknown>(`/admin/applications/professional/${id}/review`, { action: 'reject', reason })
      .pipe(tap(() => this.load().subscribe({ error: () => {} })));
  }

  submitToApi(payload: ProfessionalOnboardingPayload): Observable<unknown> {
    return this.api.postData<unknown>('/auth/onboarding/professional', payload);
  }

  /** Self-service — the only part of an application its owner may change. */
  updateOwnBio(bio: string): Observable<unknown> {
    return this.api.patchData<unknown>('/applications/professional/me/bio', { bio });
  }
}
