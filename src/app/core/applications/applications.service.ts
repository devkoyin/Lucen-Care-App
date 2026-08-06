import { Injectable, signal, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiService } from '../api/api.service';
import { WrappedResponse } from '../api/wrapped-response.model';
import { HmoOnboardingPayload, NgoOnboardingPayload } from '../auth/auth.models';
import {
  AUDIT_ACTION_MAP,
  AUDIT_SUBJECT_MAP,
  AuditAction,
  AuditSubjectType,
} from './audit-labels';

export type OrgType   = 'ngo' | 'hmo';
export type AppStatus = 'pending' | 'approved' | 'rejected';

// Re-exported for the admin components, which import the row type and its
// vocabulary from one place. The definitions live in audit-labels.ts.
export type { AuditAction, AuditSubjectType };

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
  tin?: string;
  scumlNumber?: string;
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

  // Document checklist — derived client-side from which fields the applicant
  // supplied. The API stores the values, not a checklist.
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

/** Shape returned by GET /organizations. */
interface ApiOrganization {
  id: string;
  name: string;
  type: OrgType;
  status: 'pending_verification' | 'active' | 'suspended' | 'rejected';
  contactEmail: string;
  contactPerson?: string;
  createdAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  registrationNumber?: string;
  tin?: string;
  scumlNumber?: string;
  focusAreas?: string;
  website?: string;
  operatingRegions?: string;
  headOfficeCountry?: string;
  programDescription?: string;
  licenceNumber?: string;
  contactPhone?: string;
  coverageRegion?: string;
  enrolledPatientCount?: string;
  specialtyFocus?: string;
}

/** Shape returned by GET /admin/audit. */
interface ApiAuditLog {
  id: string;
  actorId: string;
  actorName?: string;
  actorEmail?: string;
  action: string;
  resourceId: string;
  resourceType: string;
  /**
   * Resolved server-side by AuditService.attachResource(), but only for allowlisted
   * resource types — patient, medication and consent rows are deliberately unnamed
   * (see src/common/constants/auditable-resources.ts in the backend), as is any row
   * whose subject has since been deleted. Always fall back to `resourceId`.
   */
  resourceName?: string;
  /** 'ngo' | 'hmo' for organisation rows. Absent for every other resource type. */
  resourceSubtype?: string;
  metadata?: { reason?: string };
  createdAt: string;
}

const ORG_STATUS_MAP: Record<ApiOrganization['status'], AppStatus> = {
  pending_verification: 'pending',
  active: 'approved',
  rejected: 'rejected',
  // A suspended org was approved at some point; it is not awaiting review.
  suspended: 'approved',
};

function toOrgApplication(o: ApiOrganization): OrgApplication {
  const docs: AppDoc[] =
    o.type === 'ngo'
      ? [
          { label: 'Registration Number',    submitted: !!o.registrationNumber },
          { label: 'TIN',                    submitted: !!o.tin },
          { label: 'SCUML Certificate No.',  submitted: !!o.scumlNumber },
          { label: 'Focus Areas',            submitted: !!o.focusAreas },
          { label: 'Operating Regions',      submitted: !!o.operatingRegions },
          { label: 'Program Description',    submitted: !!o.programDescription },
        ]
      : [
          { label: 'Licence Number',         submitted: !!o.licenceNumber },
          { label: 'Contact Phone',          submitted: !!o.contactPhone },
          { label: 'Coverage Region',        submitted: !!o.coverageRegion },
          { label: 'Enrolled Patient Count', submitted: !!o.enrolledPatientCount },
        ];

  return {
    id: o.id,
    type: o.type,
    status: ORG_STATUS_MAP[o.status] ?? 'pending',
    submittedAt: o.createdAt,
    contactPerson: o.contactPerson ?? o.contactEmail,
    email: o.contactEmail,
    orgName: o.name,
    registrationNo: o.registrationNumber,
    tin: o.tin,
    scumlNumber: o.scumlNumber,
    focusAreas: o.focusAreas,
    website: o.website,
    operatingRegions: o.operatingRegions,
    headOfficeCountry: o.headOfficeCountry,
    programDescription: o.programDescription,
    licenceNo: o.licenceNumber,
    contactPhone: o.contactPhone,
    coverageRegion: o.coverageRegion,
    enrolledPatientCount: o.enrolledPatientCount,
    specialtyFocus: o.specialtyFocus,
    docs,
    rejectionReason: o.rejectionReason,
    reviewedAt: o.verifiedAt,
    reviewedBy: o.verifiedBy,
  };
}

/** 'ngo' | 'hmo' from the server, guarded so an unexpected value cannot mislabel. */
function toOrgSubject(subtype?: string): AuditSubjectType | undefined {
  return subtype === 'ngo' || subtype === 'hmo' ? subtype : undefined;
}

function toAuditEntry(a: ApiAuditLog): AuditEntry {
  return {
    id: a.id,
    // Unmapped actions used to fall through to 'submitted'; 'login' is the honest
    // default now, since every legacy row that lacked a mapping was a login.
    action: AUDIT_ACTION_MAP[a.action] ?? 'login',
    // The server names allowlisted subjects; the ULID is the fallback for the ones
    // it deliberately does not (patient, medication, consent) and for deleted rows.
    orgName: a.resourceName ?? a.resourceId,
    // Organisations carry their ngo/hmo subtype, so an HMO no longer wears an NGO badge.
    orgType: toOrgSubject(a.resourceSubtype) ?? AUDIT_SUBJECT_MAP[a.resourceType] ?? 'user',
    applicationId: a.resourceId,
    actor: a.actorName ?? a.actorEmail ?? a.actorId,
    timestamp: a.createdAt,
    reason: a.metadata?.reason,
  };
}

@Injectable({ providedIn: 'root' })
export class ApplicationsService {
  private readonly api = inject(ApiService);
  private readonly _applications   = signal<OrgApplication[]>([]);
  private readonly _auditLog       = signal<AuditEntry[]>([]);
  private readonly _recentActivity = signal<AuditEntry[]>([]);
  private readonly _auditCursor    = signal<string | undefined>(undefined);
  private readonly _loading        = signal(false);
  private readonly _auditLoading   = signal(false);

  readonly applications   = this._applications.asReadonly();
  readonly auditLog       = this._auditLog.asReadonly();
  readonly recentActivity = this._recentActivity.asReadonly();
  readonly auditLoading   = this._auditLoading.asReadonly();
  readonly loading        = this._loading.asReadonly();

  /** Set while the audit log has a further page to fetch. */
  readonly auditCursor = this._auditCursor.asReadonly();

  /** GET /organizations — platform admin only. Loads both NGOs and HMOs. */
  load(): Observable<OrgApplication[]> {
    this._loading.set(true);
    return this.api.getData<ApiOrganization[]>('/organizations', new HttpParams().set('limit', 50)).pipe(
      map(orgs => orgs.map(toOrgApplication)),
      tap({
        next: apps => { this._applications.set(apps); this._loading.set(false); },
        error: () => this._loading.set(false),
      }),
    );
  }

  /**
   * GET /admin/audit — keyset paginated, newest first.
   *
   * Pass the current `auditCursor()` to fetch the next page, which is APPENDED;
   * calling with no cursor starts over. Reads the wrapped response directly rather
   * than via getData so `meta.cursor` is visible.
   */
  loadAuditLog(opts: { cursor?: string; limit?: number } = {}): Observable<AuditEntry[]> {
    let params = new HttpParams().set('limit', opts.limit ?? 50);
    if (opts.cursor) params = params.set('cursor', opts.cursor);

    this._auditLoading.set(true);
    return this.api.get<WrappedResponse<ApiAuditLog[]>>('/admin/audit', params).pipe(
      tap({
        next: res => this._auditCursor.set(res.meta?.cursor),
        error: () => this._auditLoading.set(false),
      }),
      map(res => res.data.map(toAuditEntry)),
      tap(entries => {
        this._auditLog.update(existing => (opts.cursor ? [...existing, ...entries] : entries));
        this._auditLoading.set(false);
      }),
    );
  }

  /**
   * The dashboard's Recent Activity panel — the newest handful of audit events.
   *
   * Deliberately a separate signal from `auditLog`: sharing one would leave the
   * Audit Log page showing this short page, and its event count reading 6.
   */
  loadRecentActivity(limit = 6): Observable<AuditEntry[]> {
    return this.api
      .getData<ApiAuditLog[]>('/admin/audit', new HttpParams().set('limit', limit))
      .pipe(
        map(rows => rows.map(toAuditEntry)),
        tap(entries => this._recentActivity.set(entries)),
      );
  }

  // Org review uses AdminApproveDto — { status, reason } — which is a DIFFERENT
  // shape from the application review endpoints' { action, reason }.
  approve(id: string): Observable<unknown> {
    return this.api
      .patchData<unknown>(`/admin/organizations/${id}`, { status: 'approved' })
      .pipe(tap(() => this.load().subscribe({ error: () => {} })));
  }

  reject(id: string, reason: string): Observable<unknown> {
    return this.api
      .patchData<unknown>(`/admin/organizations/${id}`, { status: 'rejected', reason })
      .pipe(tap(() => this.load().subscribe({ error: () => {} })));
  }

  byType(type: OrgType): OrgApplication[] {
    return this._applications().filter(a => a.type === type);
  }

  pendingCount(type?: OrgType): number {
    return this._applications().filter(
      a => a.status === 'pending' && (!type || a.type === type)
    ).length;
  }

  /**
   * "Approved (30d)" means approved in the window, not registered in it — so this
   * measures `reviewedAt` where there is one. Filtering on `submittedAt` missed an
   * org approved yesterday that had registered months earlier.
   */
  recentCount(status: AppStatus, days = 30): number {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return this._applications().filter(a => {
      if (a.status !== status) return false;
      const at = a.reviewedAt ?? a.submittedAt;
      return new Date(at).getTime() >= cutoff;
    }).length;
  }

  submitNgoToApi(payload: NgoOnboardingPayload): Observable<unknown> {
    return this.api.postData<unknown>('/auth/onboarding/ngo', payload);
  }

  submitHmoToApi(payload: HmoOnboardingPayload): Observable<unknown> {
    return this.api.postData<unknown>('/auth/onboarding/hmo', payload);
  }
}
