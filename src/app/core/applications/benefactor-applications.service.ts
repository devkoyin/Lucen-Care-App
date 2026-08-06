import { Injectable, signal, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AppDoc } from './applications.service';
import { ApiService } from '../api/api.service';
import { BenefactorOnboardingPayload } from '../auth/auth.models';

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

/** Shape returned by GET /admin/applications/benefactor. */
interface ApiBenefactorApplication {
  id: string;
  userId: string;
  status: BenefactorAppStatus;
  submittedAt: string;
  fullName: string;
  /** Joined from users — the application table has no email column. */
  email: string;
  phone: string;
  reasonForSupport: string;
  idConsentGiven: boolean;
  rejectionReason?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

function toBenefactorApplication(a: ApiBenefactorApplication): BenefactorApplication {
  return {
    id: a.id,
    status: a.status,
    submittedAt: a.submittedAt,
    fullName: a.fullName,
    email: a.email,
    phone: a.phone,
    reasonForSupport: a.reasonForSupport,
    // Derived client-side — the API stores the values, not a checklist.
    docs: [{ label: 'Identity verification consent', submitted: !!a.idConsentGiven }],
    rejectionReason: a.rejectionReason,
    reviewedAt: a.reviewedAt,
    reviewedBy: a.reviewedBy,
  };
}

@Injectable({ providedIn: 'root' })
export class BenefactorApplicationsService {
  private readonly api = inject(ApiService);
  private readonly _applications = signal<BenefactorApplication[]>([]);
  private readonly _loading = signal(false);

  readonly applications = this._applications.asReadonly();
  readonly loading = this._loading.asReadonly();

  /** GET /admin/applications/benefactor — platform admin only. */
  load(status?: BenefactorAppStatus): Observable<BenefactorApplication[]> {
    this._loading.set(true);
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.api
      .getData<ApiBenefactorApplication[]>('/admin/applications/benefactor', params)
      .pipe(
        map(rows => rows.map(toBenefactorApplication)),
        tap({
          next: apps => { this._applications.set(apps); this._loading.set(false); },
          error: () => this._loading.set(false),
        }),
      );
  }

  // Application review uses ReviewApplicationDto — { action, reason }.
  approve(id: string): Observable<unknown> {
    return this.api
      .patchData<unknown>(`/admin/applications/benefactor/${id}/review`, { action: 'approve' })
      .pipe(tap(() => this.load().subscribe({ error: () => {} })));
  }

  reject(id: string, reason: string): Observable<unknown> {
    return this.api
      .patchData<unknown>(`/admin/applications/benefactor/${id}/review`, { action: 'reject', reason })
      .pipe(tap(() => this.load().subscribe({ error: () => {} })));
  }

  submitToApi(payload: BenefactorOnboardingPayload): Observable<unknown> {
    return this.api.postData<unknown>('/auth/onboarding/benefactor', payload);
  }
}
