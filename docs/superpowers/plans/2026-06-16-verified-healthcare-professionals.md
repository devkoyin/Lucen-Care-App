# Verified Healthcare Professionals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new `professional` role so independently verified healthcare professionals can sign up, go through admin credential review, and join patient communities with a visible "Verified Health Professional" badge.

**Architecture:** Mirror the existing NGO/HMO patterns end-to-end — a new `Role` value, a `ProfessionalApplicationsService` parallel to `ApplicationsService`, an admin approvals tab reusing the existing audit log, a lightweight `professional` portal (Community + Profile only), and a small route guard gating community/profile access on approval status. The existing patient `CommunityComponent` is reused as-is and extended to render a badge when the post author is an approved professional.

**Tech Stack:** Angular 19 (standalone components, signals), Karma + Jasmine, SCSS with CSS custom properties for per-role theming.

---

## Reference: codebase conventions used throughout this plan

- Services use `signal()` + `localStorage` persistence (see `src/app/core/applications/applications.service.ts`).
- Admin approval components (`hmo-approvals`, `ngo-approvals`) follow an identical list/expand/approve/reject pattern with near-duplicate SCSS — this plan follows that duplication convention rather than introducing a shared abstraction.
- Per-role theming is done via a CSS class `portal-<role>` applied by `SidebarShellComponent`/`OnboardingShellComponent`, with variables defined in `src/styles/tokens-<role>.scss` and registered in `src/styles.scss`.
- Run a single spec file with: `npx ng test --include='<path-to-spec>' --watch=false --browsers=ChromeHeadless`

---

### Task 1: Add the `professional` role and cover it in `AuthService`

**Files:**
- Modify: `src/app/core/auth/auth.models.ts:1`
- Test: `src/app/core/auth/auth.service.spec.ts`

- [ ] **Step 1: Write the failing test**

Add to `src/app/core/auth/auth.service.spec.ts` (after the existing `'sets non-patient status to pending on signup'` test):

```typescript
  it('sets professional status to pending on signup', () => {
    service.signup('professional', { name: 'Dr. Jane Doe', email: 'jane@doe.com', password: 'pass' }).subscribe();
    expect(service.user()?.status).toBe('pending');
    expect(service.user()?.role).toBe('professional');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test --include='src/app/core/auth/auth.service.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: FAIL — TypeScript error, `'professional'` is not assignable to type `Role`.

- [ ] **Step 3: Widen the `Role` type**

In `src/app/core/auth/auth.models.ts`, change line 1:

```typescript
export type Role = 'patient' | 'ngo' | 'hmo' | 'admin' | 'professional';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ng test --include='src/app/core/auth/auth.service.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: PASS, all tests in the file green.

- [ ] **Step 5: Commit**

```bash
git add src/app/core/auth/auth.models.ts src/app/core/auth/auth.service.spec.ts
git commit -m "feat: add professional role to Role union"
```

---

### Task 2: Make the audit log mechanism accept professional events

**Files:**
- Modify: `src/app/core/applications/applications.service.ts`
- Test: `src/app/core/applications/applications.service.spec.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `src/app/core/applications/applications.service.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { ApplicationsService } from './applications.service';

describe('ApplicationsService', () => {
  let service: ApplicationsService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [ApplicationsService] });
    service = TestBed.inject(ApplicationsService);
  });

  it('creates', () => expect(service).toBeTruthy());

  it('records an audit entry for a professional subject via the public addAudit method', () => {
    service.addAudit({
      action: 'submitted',
      orgName: 'Dr. Jane Doe',
      orgType: 'professional',
      applicationId: 'prof-1',
      actor: 'System',
    });
    const entry = service.auditLog()[0];
    expect(entry.orgType).toBe('professional');
    expect(entry.orgName).toBe('Dr. Jane Doe');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test --include='src/app/core/applications/applications.service.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: FAIL — `addAudit` is private, and `orgType: 'professional'` does not match type `OrgType`.

- [ ] **Step 3: Widen the audit subject type and make `addAudit` public**

In `src/app/core/applications/applications.service.ts`, change:

```typescript
export type OrgType    = 'ngo' | 'hmo';
export type AppStatus  = 'pending' | 'approved' | 'rejected';
export type AuditAction = 'submitted' | 'approved' | 'rejected';
```

to:

```typescript
export type OrgType    = 'ngo' | 'hmo';
export type AuditSubjectType = OrgType | 'professional';
export type AppStatus  = 'pending' | 'approved' | 'rejected';
export type AuditAction = 'submitted' | 'approved' | 'rejected';
```

Change the `AuditEntry` interface's `orgType` field:

```typescript
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
```

Change the method visibility (remove `private`):

```typescript
  addAudit(entry: Omit<AuditEntry, 'id' | 'timestamp'>): void {
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ng test --include='src/app/core/applications/applications.service.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/core/applications/applications.service.ts src/app/core/applications/applications.service.spec.ts
git commit -m "feat: widen audit log to accept professional subject events"
```

---

### Task 3: Create `ProfessionalApplicationsService`

**Files:**
- Create: `src/app/core/applications/professional-applications.service.ts`
- Test: `src/app/core/applications/professional-applications.service.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/core/applications/professional-applications.service.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { ProfessionalApplicationsService } from './professional-applications.service';
import { ApplicationsService } from './applications.service';

describe('ProfessionalApplicationsService', () => {
  let service: ProfessionalApplicationsService;
  let appsService: ApplicationsService;

  const baseApp = {
    fullName: 'Dr. Jane Doe',
    email: 'jane@doe.com',
    phone: '08000000000',
    profession: 'Doctor' as const,
    licenseNumber: 'LIC-123',
    specialty: 'Cardiology',
    yearsOfExperience: 8,
    bio: 'Cardiologist with 8 years of clinical practice.',
    docs: [{ label: 'Medical License / Registration', submitted: true }],
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [ProfessionalApplicationsService, ApplicationsService] });
    service = TestBed.inject(ProfessionalApplicationsService);
    appsService = TestBed.inject(ApplicationsService);
  });

  it('creates', () => expect(service).toBeTruthy());

  it('submits a new application with pending status', () => {
    service.submit(baseApp);
    const apps = service.applications();
    expect(apps.length).toBe(1);
    expect(apps[0].status).toBe('pending');
    expect(apps[0].fullName).toBe('Dr. Jane Doe');
  });

  it('logs a submission audit entry through ApplicationsService', () => {
    service.submit(baseApp);
    const entry = appsService.auditLog()[0];
    expect(entry.action).toBe('submitted');
    expect(entry.orgType).toBe('professional');
    expect(entry.orgName).toBe('Dr. Jane Doe');
  });

  it('approves an application and logs an audit entry', () => {
    service.submit(baseApp);
    const id = service.applications()[0].id;
    service.approve(id, 'Admin Taiwo');
    expect(service.applications()[0].status).toBe('approved');
    const entry = appsService.auditLog()[0];
    expect(entry.action).toBe('approved');
    expect(entry.actor).toBe('Admin Taiwo');
  });

  it('rejects an application with a reason', () => {
    service.submit(baseApp);
    const id = service.applications()[0].id;
    service.reject(id, 'Licence could not be verified', 'Admin Taiwo');
    expect(service.applications()[0].status).toBe('rejected');
    expect(service.applications()[0].rejectionReason).toBe('Licence could not be verified');
  });

  it('finds an application by email', () => {
    service.submit(baseApp);
    expect(service.findByEmail('jane@doe.com')?.fullName).toBe('Dr. Jane Doe');
    expect(service.findByEmail('nope@doe.com')).toBeUndefined();
  });

  it('updates the bio for an application', () => {
    service.submit(baseApp);
    const id = service.applications()[0].id;
    service.updateBio(id, 'Updated bio text');
    expect(service.applications()[0].bio).toBe('Updated bio text');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test --include='src/app/core/applications/professional-applications.service.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: FAIL — cannot find module `./professional-applications.service`.

- [ ] **Step 3: Implement the service**

Create `src/app/core/applications/professional-applications.service.ts`:

```typescript
import { Injectable, signal, inject } from '@angular/core';
import { ApplicationsService, AppDoc } from './applications.service';

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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ng test --include='src/app/core/applications/professional-applications.service.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: PASS, all 7 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/app/core/applications/professional-applications.service.ts src/app/core/applications/professional-applications.service.spec.ts
git commit -m "feat: add ProfessionalApplicationsService"
```

---

### Task 4: Add a guard that blocks unapproved professionals from community/profile routes

**Files:**
- Create: `src/app/core/auth/professional-approved.guard.ts`
- Test: `src/app/core/auth/professional-approved.guard.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/core/auth/professional-approved.guard.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { professionalApprovedGuard } from './professional-approved.guard';
import { AuthService } from './auth.service';
import { ProfessionalApplicationsService } from '../applications/professional-applications.service';

describe('professionalApprovedGuard', () => {
  let auth: AuthService;
  let apps: ProfessionalApplicationsService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    auth = TestBed.inject(AuthService);
    apps = TestBed.inject(ProfessionalApplicationsService);
  });

  function runGuard(): boolean | UrlTree {
    return TestBed.runInInjectionContext(() =>
      professionalApprovedGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    ) as boolean | UrlTree;
  }

  it('redirects to pending when not authenticated', () => {
    expect(runGuard() instanceof UrlTree).toBeTrue();
  });

  it('redirects to pending when the professional application is not approved', () => {
    auth.signup('professional', { name: 'Dr. Jane', email: 'jane@doe.com', password: 'password123' }).subscribe();
    apps.submit({
      fullName: 'Dr. Jane', email: 'jane@doe.com', phone: '0800', profession: 'Doctor',
      licenseNumber: 'LIC-1', specialty: 'Cardiology', yearsOfExperience: 5, bio: 'bio', docs: [],
    });
    expect(runGuard() instanceof UrlTree).toBeTrue();
  });

  it('allows access once the professional application is approved', () => {
    auth.signup('professional', { name: 'Dr. Jane', email: 'jane@doe.com', password: 'password123' }).subscribe();
    apps.submit({
      fullName: 'Dr. Jane', email: 'jane@doe.com', phone: '0800', profession: 'Doctor',
      licenseNumber: 'LIC-1', specialty: 'Cardiology', yearsOfExperience: 5, bio: 'bio', docs: [],
    });
    apps.approve(apps.applications()[0].id);
    expect(runGuard()).toBeTrue();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test --include='src/app/core/auth/professional-approved.guard.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: FAIL — cannot find module `./professional-approved.guard`.

- [ ] **Step 3: Implement the guard**

Create `src/app/core/auth/professional-approved.guard.ts`:

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ProfessionalApplicationsService } from '../applications/professional-applications.service';

export const professionalApprovedGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const apps   = inject(ProfessionalApplicationsService);
  const router = inject(Router);

  const user = auth.user();
  const application = user ? apps.findByEmail(user.email) : undefined;

  if (user?.role === 'professional' && application?.status === 'approved') {
    return true;
  }

  return router.createUrlTree(['/professional/pending']);
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ng test --include='src/app/core/auth/professional-approved.guard.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/core/auth/professional-approved.guard.ts src/app/core/auth/professional-approved.guard.spec.ts
git commit -m "feat: add guard restricting professional routes to approved applicants"
```

---

### Task 5: Admin "Professional Approvals" page

**Files:**
- Create: `src/app/features/admin/professional-approvals/professional-approvals.component.ts`
- Create: `src/app/features/admin/professional-approvals/professional-approvals.component.html`
- Create: `src/app/features/admin/professional-approvals/professional-approvals.component.scss` (verbatim copy of `hmo-approvals.component.scss` — same class names, themed entirely via `--color-role-accent` which the admin portal already sets)
- Test: `src/app/features/admin/professional-approvals/professional-approvals.component.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/features/admin/professional-approvals/professional-approvals.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfessionalApprovalsComponent } from './professional-approvals.component';
import { ProfessionalApplicationsService } from '../../../core/applications/professional-applications.service';

describe('ProfessionalApprovalsComponent', () => {
  let fixture: ComponentFixture<ProfessionalApprovalsComponent>;
  let component: ProfessionalApprovalsComponent;
  let service: ProfessionalApplicationsService;

  const baseApp = {
    fullName: 'Dr. Jane Doe', email: 'jane@doe.com', phone: '0800', profession: 'Doctor' as const,
    licenseNumber: 'LIC-1', specialty: 'Cardiology', yearsOfExperience: 5, bio: 'bio',
    docs: [{ label: 'Medical License / Registration', submitted: true }],
  };

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [ProfessionalApprovalsComponent] }).compileComponents();
    fixture = TestBed.createComponent(ProfessionalApprovalsComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(ProfessionalApplicationsService);
    fixture.detectChanges();
  });

  it('creates', () => expect(component).toBeTruthy());

  it('shows zero applications by default', () => {
    expect(component.filtered.length).toBe(0);
  });

  it('lists a submitted application under the pending tab', () => {
    service.submit(baseApp);
    fixture.detectChanges();
    component.setTab('pending');
    expect(component.filtered.length).toBe(1);
    expect(component.filtered[0].fullName).toBe('Dr. Jane Doe');
  });

  it('approve() moves an application out of pending', () => {
    service.submit(baseApp);
    const id = service.applications()[0].id;
    component.approve(id);
    expect(service.applications()[0].status).toBe('approved');
  });

  it('confirmReject() rejects with the entered reason', () => {
    service.submit(baseApp);
    const id = service.applications()[0].id;
    component.startReject(id);
    component.rejectReason.set('Could not verify licence');
    component.confirmReject(id);
    expect(service.applications()[0].status).toBe('rejected');
    expect(service.applications()[0].rejectionReason).toBe('Could not verify licence');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test --include='src/app/features/admin/professional-approvals/professional-approvals.component.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: FAIL — cannot find module `./professional-approvals.component`.

- [ ] **Step 3: Implement the component**

Create `src/app/features/admin/professional-approvals/professional-approvals.component.ts`:

```typescript
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
```

Create `src/app/features/admin/professional-approvals/professional-approvals.component.html`:

```html
<div class="approvals">

  <!-- Header -->
  <div class="page-header">
    <div>
      <h1 class="page-header__title">Healthcare Professional Applications</h1>
      <p class="page-header__sub">Review and verify independent healthcare professional applications</p>
    </div>
  </div>

  <!-- Filter tabs -->
  <div class="filter-tabs">
    @for (tab of tabs; track tab.id) {
      <button
        class="filter-tab"
        [class.filter-tab--active]="activeTab() === tab.id"
        (click)="setTab(tab.id)">
        {{ tab.label }}
        <span class="filter-tab__count">{{ countFor(tab.id) }}</span>
      </button>
    }
  </div>

  <!-- Applications list -->
  <div class="app-list">
    @for (app of filtered; track app.id) {
      <div class="app-card" [class.app-card--expanded]="expandedId() === app.id">

        <!-- Row summary -->
        <div class="app-card__row" (click)="toggleExpand(app.id)">
          <div class="app-card__main">
            <span class="app-card__name">{{ app.fullName }}</span>
            <span class="app-card__meta">{{ app.profession }} · {{ app.specialty }} · {{ app.email }}</span>
          </div>
          <div class="app-card__meta-col">
            <span class="app-card__reg">{{ app.licenseNumber }}</span>
            <span class="app-card__date">Submitted {{ formatDate(app.submittedAt) }}</span>
          </div>
          <div class="app-card__docs-col">
            @if (docsComplete(app)) {
              <span class="docs-badge docs-badge--complete">✓ All docs</span>
            } @else {
              <span class="docs-badge docs-badge--missing">⚠ Incomplete</span>
            }
          </div>
          <span class="status-badge status-badge--{{ app.status }}">
            {{ app.status === 'pending' ? 'Pending' : app.status === 'approved' ? 'Approved' : 'Rejected' }}
          </span>
          <span class="app-card__chevron" [class.app-card__chevron--open]="expandedId() === app.id">›</span>
        </div>

        <!-- Expanded detail -->
        @if (expandedId() === app.id) {
          <div class="app-card__detail">

            <div class="detail-grid">
              <div class="detail-section">
                <p class="detail-section__title">Contact &amp; Credentials</p>
                <dl class="detail-list">
                  <dt>Full Name</dt><dd>{{ app.fullName }}</dd>
                  <dt>Email</dt><dd>{{ app.email }}</dd>
                  <dt>Phone</dt><dd>{{ app.phone || '—' }}</dd>
                  <dt>Profession</dt><dd>{{ app.profession }}</dd>
                  <dt>Specialty</dt><dd>{{ app.specialty }}</dd>
                  <dt>Licence Number</dt><dd>{{ app.licenseNumber }}</dd>
                  <dt>Years of Experience</dt><dd>{{ app.yearsOfExperience }}</dd>
                </dl>
              </div>

              <div class="detail-section">
                <p class="detail-section__title">Submitted Information</p>
                <div class="doc-list">
                  @for (doc of app.docs; track doc.label) {
                    <div class="doc-item">
                      <span class="doc-item__icon">{{ doc.submitted ? '✓' : '✕' }}</span>
                      <span class="doc-item__label" [class.doc-item__label--missing]="!doc.submitted">{{ doc.label }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>

            @if (app.status === 'rejected' && app.rejectionReason) {
              <div class="rejection-note">
                <span class="rejection-note__label">Rejection reason:</span>
                {{ app.rejectionReason }}
              </div>
            }

            @if (rejectingId() === app.id) {
              <div class="reject-form">
                <label class="reject-form__label" for="reason-{{ app.id }}">Rejection reason</label>
                <textarea
                  id="reason-{{ app.id }}"
                  class="reject-form__textarea"
                  rows="3"
                  placeholder="Explain why this application is being rejected…"
                  [value]="rejectReason()"
                  (input)="rejectReason.set($any($event.target).value)">
                </textarea>
                <div class="reject-form__actions">
                  <button class="btn-ghost" (click)="cancelReject()">Cancel</button>
                  <button class="btn-danger" [disabled]="!rejectReason().trim()" (click)="confirmReject(app.id)">Confirm Rejection</button>
                </div>
              </div>
            }

            @if (app.status === 'pending' && rejectingId() !== app.id) {
              <div class="app-card__actions">
                <button class="btn-approve" (click)="approve(app.id)">✓ Approve</button>
                <button class="btn-reject" (click)="startReject(app.id)">✕ Reject</button>
              </div>
            }

          </div>
        }

      </div>
    }

    @if (filtered.length === 0) {
      <div class="empty-state">No applications in this category.</div>
    }
  </div>

</div>
```

Create `src/app/features/admin/professional-approvals/professional-approvals.component.scss` as a byte-for-byte copy of `src/app/features/admin/hmo-approvals/hmo-approvals.component.scss` (343 lines — same class names, fully theme-token driven, no HMO/NGO-specific content to adapt):

```bash
cp "src/app/features/admin/hmo-approvals/hmo-approvals.component.scss" "src/app/features/admin/professional-approvals/professional-approvals.component.scss"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ng test --include='src/app/features/admin/professional-approvals/professional-approvals.component.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: PASS, all 5 tests green.

- [ ] **Step 5: Wire the route**

In `src/app/features/admin/admin.routes.ts`, add a new child route after `hmo-approvals` (before `audit-log`):

```typescript
      {
        path: 'professional-approvals',
        loadComponent: () =>
          import('./professional-approvals/professional-approvals.component').then(m => m.ProfessionalApprovalsComponent),
      },
```

- [ ] **Step 6: Write a failing test for the admin nav item**

Create `src/app/features/admin/admin-portal.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminPortalComponent } from './admin-portal.component';

describe('AdminPortalComponent', () => {
  let fixture: ComponentFixture<AdminPortalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPortalComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(AdminPortalComponent);
    fixture.detectChanges();
  });

  it('creates', () => expect(fixture.componentInstance).toBeTruthy());

  it('includes a nav item for professional approvals', () => {
    const item = fixture.componentInstance.navItems.find(i => i.route === '/admin/professional-approvals');
    expect(item?.label).toBe('Professional Approvals');
  });
});
```

- [ ] **Step 7: Run test to verify it fails**

Run: `npx ng test --include='src/app/features/admin/admin-portal.component.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: FAIL — no nav item with that route exists yet.

- [ ] **Step 8: Add the nav item**

In `src/app/features/admin/admin-portal.component.ts`, change the `navItems` array:

```typescript
  readonly navItems: NavItem[] = [
    { icon: '🏠', label: 'Dashboard',               route: '/admin/dashboard' },
    { icon: '🏢', label: 'NGO Approvals',            route: '/admin/ngo-approvals' },
    { icon: '🏥', label: 'HMO Approvals',             route: '/admin/hmo-approvals' },
    { icon: '⚕️', label: 'Professional Approvals',   route: '/admin/professional-approvals' },
    { icon: '📋', label: 'Audit Log',                route: '/admin/audit-log' },
  ];
```

- [ ] **Step 9: Run both new specs to verify they pass**

Run: `npx ng test --include='src/app/features/admin/admin-portal.component.spec.ts' --include='src/app/features/admin/professional-approvals/professional-approvals.component.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: PASS

- [ ] **Step 10: Update the audit log to label professional events**

In `src/app/features/admin/audit-log/audit-log.component.ts`, change the import:

```typescript
import { ApplicationsService, AuditEntry, AuditAction, AuditSubjectType } from '../../../core/applications/applications.service';
```

Change `typeLabel`:

```typescript
  typeLabel(type: AuditSubjectType): string {
    if (type === 'ngo') return 'NGO';
    if (type === 'hmo') return 'HMO';
    return 'Professional';
  }
```

In `src/app/features/admin/audit-log/audit-log.component.scss`, add a new variant inside the existing `.type-badge` block (after the `&--hmo` line):

```scss
  &--professional { background: rgba(22,163,74,0.10); color: #15803D; border: 1px solid rgba(22,163,74,0.25); }
```

- [ ] **Step 11: Run the full suite once to confirm nothing else broke**

Run: `npx ng test --watch=false --browsers=ChromeHeadless`
Expected: PASS, no regressions in `audit-log` or elsewhere.

- [ ] **Step 12: Commit**

```bash
git add src/app/features/admin/professional-approvals src/app/features/admin/admin.routes.ts src/app/features/admin/admin-portal.component.ts src/app/features/admin/admin-portal.component.spec.ts src/app/features/admin/audit-log/audit-log.component.ts src/app/features/admin/audit-log/audit-log.component.scss
git commit -m "feat: add admin Professional Approvals page and wire it into nav/audit log"
```

---

### Task 6: Add "Healthcare Professional" to the public role-selection page

**Files:**
- Modify: `src/app/features/public/role-selection/role-selection.component.ts`
- Modify: `src/app/features/public/role-selection/role-selection.component.html`
- Modify: `src/app/features/public/role-selection/role-selection.component.scss`
- Test: `src/app/features/public/role-selection/role-selection.component.spec.ts` (modify existing)

- [ ] **Step 1: Update the failing assertion in the existing spec**

In `src/app/features/public/role-selection/role-selection.component.spec.ts`, change:

```typescript
  it('renders 4 role options', () => {
    expect(fixture.nativeElement.querySelectorAll('.role-option').length).toBe(4);
  });
```

to:

```typescript
  it('renders 5 role options', () => {
    expect(fixture.nativeElement.querySelectorAll('.role-option').length).toBe(5);
  });
```

Also add a new test after the existing `'navigates to the correct signup route when continue() is called'` test:

```typescript
  it('navigates to the professional signup route when continue() is called', () => {
    const router = TestBed.inject(Router);
    const spy = spyOn(router, 'navigate');
    component.selectRole('professional');
    component.continue();
    expect(spy).toHaveBeenCalledWith(['/auth', 'professional', 'signup']);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test --include='src/app/features/public/role-selection/role-selection.component.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: FAIL — only 4 `.role-option` elements exist, and `'professional'` is not a valid argument to `selectRole`.

- [ ] **Step 3: Add the professional role option**

In `src/app/features/public/role-selection/role-selection.component.ts`, change the local `Role` type and `roles` array:

```typescript
type Role = 'patient' | 'ngo' | 'hmo' | 'admin' | 'professional';

interface RoleOption {
  id: Role;
  emoji: string;
  label: string;
  description: string;
}
```

```typescript
  readonly roles: RoleOption[] = [
    { id: 'patient',      emoji: '🏥', label: 'Patient & Caregiver',  description: 'Health tracking, support & funding access' },
    { id: 'ngo',          emoji: '🤝', label: 'NGO',                  description: 'Funding programs & patient matching' },
    { id: 'hmo',          emoji: '🏦', label: 'HMO',                  description: 'Longitudinal care management' },
    { id: 'professional', emoji: '⚕️', label: 'Healthcare Professional', description: 'Verified volunteer support in patient communities' },
    { id: 'admin',        emoji: '🛡️', label: 'Admin',               description: 'Approve & manage organisation accounts' },
  ];
```

In `src/app/features/public/role-selection/role-selection.component.html`, add a `role-option--professional` class binding alongside the existing ones:

```html
          [class.role-option--patient]="role.id === 'patient'"
          [class.role-option--ngo]="role.id === 'ngo'"
          [class.role-option--hmo]="role.id === 'hmo'"
          [class.role-option--professional]="role.id === 'professional'"
```

In `src/app/features/public/role-selection/role-selection.component.scss`, add a new selected-state variant after the existing `&--hmo.role-option--selected` block:

```scss
  &--professional.role-option--selected {
    background: rgba(22, 163, 74, 0.06);
    border-color: rgba(22, 163, 74, 0.35);
    .role-option__label { color: #15803D; }
    .role-option__radio--checked { background: #16A34A; border-color: #16A34A; color: #FFFFFF; }
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ng test --include='src/app/features/public/role-selection/role-selection.component.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/features/public/role-selection
git commit -m "feat: add Healthcare Professional option to role selection"
```

---

### Task 7: Add per-role theme tokens for the professional portal

**Files:**
- Create: `src/styles/tokens-professional.scss`
- Modify: `src/styles.scss`

No test for this task — it is a pure CSS variable addition with no behavior to assert; it is consumed visually by `portal-professional` class bindings added in later tasks.

- [ ] **Step 1: Create the token file**

Create `src/styles/tokens-professional.scss`:

```scss
.portal-professional {
  --color-role-accent:    #16A34A;
  --color-role-surface:   rgba(22, 163, 74, 0.08);
  --color-role-border:    rgba(22, 163, 74, 0.20);
  --btn-primary-bg:       #16A34A;
  --btn-primary-text:     #FFFFFF;
  --btn-secondary-border: #16A34A;
  --btn-secondary-text:   #16A34A;
  --btn-accent-bg:        #16A34A;
  --btn-accent-text:      #FFFFFF;
  --sidebar-bg:           #16A34A;
  --login-bg-dark:        #0a1a0e;
  --login-grid-line:      rgba(22, 163, 74, 0.08);
}
```

- [ ] **Step 2: Register it in the global stylesheet**

In `src/styles.scss`, add a new `@use` line after `tokens-hmo`:

```scss
@use 'styles/tokens';
@use 'styles/tokens-patient';
@use 'styles/tokens-ngo';
@use 'styles/tokens-hmo';
@use 'styles/tokens-professional';
@use 'styles/tokens-admin';
@use 'styles/global';
```

- [ ] **Step 3: Verify the build still compiles**

Run: `npx ng build --configuration development`
Expected: build succeeds with no SCSS errors.

- [ ] **Step 4: Commit**

```bash
git add src/styles/tokens-professional.scss src/styles.scss
git commit -m "feat: add professional portal theme tokens"
```

---

### Task 8: Wire the professional role into signup and login

**Files:**
- Modify: `src/app/features/auth/signup/signup.component.ts`
- Modify: `src/app/features/auth/login/login.component.ts`
- Test: `src/app/features/auth/login/login.component.spec.ts` (modify existing)

- [ ] **Step 1: Write the failing test**

In `src/app/features/auth/login/login.component.spec.ts`, add a new test after `'calls auth.login on valid submit'`:

```typescript
  it('navigates professionals to the community page instead of dashboard', () => {
    const router = TestBed.inject(Router);
    const navSpy = spyOn(router, 'navigate');
    fixture.componentInstance.role = 'professional';
    fixture.componentInstance.selectRole('professional');
    fixture.componentInstance.form.setValue({ email: 'jane@doe.com', password: 'password123' });
    authSpy.login.and.returnValue(of({ id: '2', role: 'professional', name: 'Dr. Jane', email: 'jane@doe.com', status: 'pending' }));
    fixture.componentInstance.submit();
    expect(navSpy).toHaveBeenCalledWith(['/', 'professional', 'community']);
  });
```

Add the `Router` import at the top of the file:

```typescript
import { Router, RouterLink } from '@angular/router';
```

(this import already exists in the file from `provideRouter`/template usage — only the `Router` token itself needs adding if not already present; confirm by checking the existing import line before editing.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test --include='src/app/features/auth/login/login.component.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: FAIL — `navigate` is called with `['/', 'professional', 'dashboard']`, not `['/', 'professional', 'community']`.

- [ ] **Step 3: Update login redirect logic and role lists**

In `src/app/features/auth/login/login.component.ts`, change the constants:

```typescript
const ROLE_LABELS: Record<string, string> = {
  patient: 'Patient & Caregiver',
  ngo: 'NGO',
  hmo: 'HMO',
  professional: 'Healthcare Professional',
  admin: 'Admin',
};

const ROLES: { id: Role; label: string; emoji: string }[] = [
  { id: 'patient',      label: 'Patient',      emoji: '🏥' },
  { id: 'ngo',          label: 'NGO',          emoji: '🤝' },
  { id: 'hmo',          label: 'HMO',          emoji: '🏛' },
  { id: 'professional', label: 'Professional', emoji: '⚕️' },
];
```

Change `submit()`:

```typescript
  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.loading     = true;
    this.serverError = '';
    const role = this.selectedRole();
    const landing = role === 'professional' ? 'community' : 'dashboard';
    this.auth.login(role, this.form.getRawValue() as LoginPayload).subscribe({
      next: () => this.router.navigate(['/', role, landing]),
      error: (e: { error?: { message?: string } }) => {
        this.loading = false;
        this.serverError = e?.error?.message ?? 'Something went wrong. Please try again.';
      },
    });
  }
```

In `src/app/features/auth/signup/signup.component.ts`, add the new label:

```typescript
const ROLE_LABELS: Record<string, string> = {
  patient: 'Patient & Caregiver',
  ngo: 'NGO',
  hmo: 'HMO',
  professional: 'Healthcare Professional',
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ng test --include='src/app/features/auth/login/login.component.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/features/auth/signup/signup.component.ts src/app/features/auth/login/login.component.ts src/app/features/auth/login/login.component.spec.ts
git commit -m "feat: wire professional role into signup and login"
```

---

### Task 9: Professional onboarding flow

**Files:**
- Create: `src/app/features/auth/onboarding/professional/professional-onboarding.component.ts`
- Create: `src/app/features/auth/onboarding/professional/professional-onboarding.component.html`
- Create: `src/app/features/auth/onboarding/professional/professional-onboarding.component.scss` (copy of `ngo-onboarding.component.scss` — identical class names)
- Modify: `src/app/features/auth/auth.routes.ts`
- Test: `src/app/features/auth/onboarding/professional/professional-onboarding.component.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/features/auth/onboarding/professional/professional-onboarding.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { ProfessionalOnboardingComponent } from './professional-onboarding.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { User } from '../../../../core/auth/auth.models';

describe('ProfessionalOnboardingComponent', () => {
  let fixture: ComponentFixture<ProfessionalOnboardingComponent>;

  const mockUser: User = { id: '1', role: 'professional', name: 'Dr. Jane Doe', email: 'jane@doe.com', status: 'pending' };

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'signup', 'signOut', 'isAuthenticated', 'role'], {
      user: signal(mockUser),
    });

    await TestBed.configureTestingModule({
      imports: [ProfessionalOnboardingComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfessionalOnboardingComponent);
    fixture.detectChanges();
  });

  it('creates', () => expect(fixture.componentInstance).toBeTruthy());
  it('starts on step 1', () => expect(fixture.componentInstance.currentStep).toBe(1));
  it('step 1 canContinue is false when fields empty', () => expect(fixture.componentInstance.canContinue).toBeFalse());

  it('advances step on next() when form valid', () => {
    fixture.componentInstance.step1Form.setValue({
      profession: 'Doctor', licenseNumber: 'LIC-1', specialty: 'Cardiology', yearsOfExperience: 5, phone: '0800000000',
    });
    fixture.componentInstance.next();
    expect(fixture.componentInstance.currentStep).toBe(2);
  });

  it('does not advance when form invalid', () => {
    fixture.componentInstance.next();
    expect(fixture.componentInstance.currentStep).toBe(1);
  });

  it('back() decrements step', () => {
    fixture.componentInstance.currentStep = 2;
    fixture.componentInstance.back();
    expect(fixture.componentInstance.currentStep).toBe(1);
  });

  it('continueLabel is "Return to home" on step 4', () => {
    fixture.componentInstance.currentStep = 4;
    expect(fixture.componentInstance.continueLabel).toBe('Return to home');
  });

  it('stepTitle reflects currentStep', () => {
    expect(fixture.componentInstance.stepTitle).toBe('Tell us about your practice');
    fixture.componentInstance.currentStep = 4;
    expect(fixture.componentInstance.stepTitle).toBe('Application submitted');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test --include='src/app/features/auth/onboarding/professional/professional-onboarding.component.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: FAIL — cannot find module `./professional-onboarding.component`.

- [ ] **Step 3: Implement the component**

Create `src/app/features/auth/onboarding/professional/professional-onboarding.component.ts`:

```typescript
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { ProfessionalApplicationsService } from '../../../../core/applications/professional-applications.service';
import { OnboardingShellComponent } from '../onboarding-shell/onboarding-shell.component';
import { FormFieldComponent } from '../../../../shared/components/form-field/form-field.component';

@Component({
  selector: 'lc-professional-onboarding',
  standalone: true,
  imports: [ReactiveFormsModule, OnboardingShellComponent, FormFieldComponent],
  templateUrl: './professional-onboarding.component.html',
  styleUrl: './professional-onboarding.component.scss',
})
export class ProfessionalOnboardingComponent {
  private readonly fb     = inject(FormBuilder);
  private readonly auth   = inject(AuthService);
  private readonly apps   = inject(ProfessionalApplicationsService);
  private readonly router = inject(Router);

  currentStep = 1;
  readonly totalSteps = 4;
  readonly stepLabels = ['Professional info', 'Credentials', 'Terms & consent', 'Verification'];

  readonly step1Form = this.fb.group({
    profession: ['', Validators.required],
    licenseNumber: ['', Validators.required],
    specialty: ['', Validators.required],
    yearsOfExperience: ['', [Validators.required, Validators.min(0)]],
    phone: ['', Validators.required],
  });

  readonly step2Form = this.fb.group({
    bio: ['', Validators.required],
  });

  readonly step3Form = this.fb.group({
    termsConsent: [false, Validators.requiredTrue],
    codeOfConductConsent: [false, Validators.requiredTrue],
  });

  get currentForm(): FormGroup | null {
    if (this.currentStep === 1) return this.step1Form;
    if (this.currentStep === 2) return this.step2Form;
    if (this.currentStep === 3) return this.step3Form;
    return null;
  }

  get stepTitle(): string {
    const titles: Record<number, string> = {
      1: 'Tell us about your practice',
      2: 'Your credentials',
      3: 'Terms & code of conduct',
      4: 'Application submitted',
    };
    return titles[this.currentStep] ?? '';
  }

  get canContinue(): boolean {
    if (this.currentStep === 4) return true;
    return this.currentForm?.valid ?? true;
  }

  get continueLabel(): string {
    return this.currentStep === 4 ? 'Return to home' : 'Continue';
  }

  get fullName(): string {
    return this.auth.user()?.name ?? 'your account';
  }

  back(): void {
    if (this.currentStep > 1) this.currentStep--;
  }

  next(): void {
    if (this.currentStep === 4) {
      this.router.navigate(['/']);
      return;
    }
    const form = this.currentForm;
    form?.markAllAsTouched();
    if (form?.invalid) return;

    if (this.currentStep === 3) {
      const user = this.auth.user();
      const s1 = this.step1Form.value;
      const s2 = this.step2Form.value;
      this.apps.submit({
        fullName: user?.name ?? '',
        email: user?.email ?? '',
        phone: s1.phone ?? '',
        profession: (s1.profession as 'Doctor' | 'Nurse' | 'Therapist' | 'Other') ?? 'Other',
        licenseNumber: s1.licenseNumber ?? '',
        specialty: s1.specialty ?? '',
        yearsOfExperience: Number(s1.yearsOfExperience ?? 0),
        bio: s2.bio ?? '',
        docs: [
          { label: 'Medical License / Registration', submitted: !!s1.licenseNumber },
          { label: 'Specialty / Certification',       submitted: !!s1.specialty },
          { label: 'Practice Bio',                    submitted: !!s2.bio },
        ],
      });
    }

    this.currentStep++;
  }
}
```

Create `src/app/features/auth/onboarding/professional/professional-onboarding.component.html`:

```html
<lc-onboarding-shell
  [currentStep]="currentStep"
  [totalSteps]="totalSteps"
  [stepLabels]="stepLabels"
  [stepTitle]="stepTitle"
  [canContinue]="canContinue"
  [continueLabel]="continueLabel"
  role="professional"
  (back)="back()"
  (continue)="next()">

  @switch (currentStep) {
    @case (1) {
      <div class="step-content" [formGroup]="step1Form">
        <lc-form-field label="Profession" id="prof-profession">
          <select id="prof-profession" formControlName="profession">
            <option value="">Select...</option>
            <option value="Doctor">Doctor</option>
            <option value="Nurse">Nurse</option>
            <option value="Therapist">Therapist</option>
            <option value="Other">Other</option>
          </select>
        </lc-form-field>
        <lc-form-field label="Medical licence / registration number" id="prof-license">
          <input id="prof-license" type="text" formControlName="licenseNumber" placeholder="Official licence or registration number" />
        </lc-form-field>
        <lc-form-field label="Specialty" id="prof-specialty" hint="e.g. Cardiology, Endocrinology, Mental Health">
          <input id="prof-specialty" type="text" formControlName="specialty" placeholder="Your area of clinical focus" />
        </lc-form-field>
        <lc-form-field label="Years of experience" id="prof-experience">
          <input id="prof-experience" type="number" min="0" formControlName="yearsOfExperience" placeholder="e.g. 8" />
        </lc-form-field>
        <lc-form-field label="Phone" id="prof-phone">
          <input id="prof-phone" type="tel" formControlName="phone" placeholder="Contact phone number" />
        </lc-form-field>
      </div>
    }
    @case (2) {
      <div class="step-content" [formGroup]="step2Form">
        <lc-form-field label="Practice bio" id="prof-bio" hint="Shown to patients alongside your verified badge">
          <textarea id="prof-bio" formControlName="bio" rows="5" placeholder="Briefly describe your background and how you'd like to help patients..."></textarea>
        </lc-form-field>
      </div>
    }
    @case (3) {
      <div class="step-content" [formGroup]="step3Form">
        <div class="consent-list">
          <label class="consent-item">
            <input type="checkbox" formControlName="termsConsent" />
            <div class="consent-item__text">
              <span class="consent-item__label">
                Terms of Service
                <span class="consent-item__req">Required</span>
              </span>
              <span class="consent-item__desc">I agree to the Lucen Care Terms of Service and confirm that the credentials I've provided are accurate.</span>
            </div>
          </label>
          <label class="consent-item">
            <input type="checkbox" formControlName="codeOfConductConsent" />
            <div class="consent-item__text">
              <span class="consent-item__label">
                Community code of conduct
                <span class="consent-item__req">Required</span>
              </span>
              <span class="consent-item__desc">I agree to share experience-based guidance only, defer clinical decisions to each patient's own care team, and follow Lucen Care's community guidelines.</span>
            </div>
          </label>
        </div>
        <p class="upload-note">
          <span class="upload-note__icon" aria-hidden="true">📎</span>
          Our team will verify your licence and credentials during admin review. You'll receive an activation email once approved.
        </p>
      </div>
    }
    @case (4) {
      <div class="step-content step-content--pending">
        <div class="pending-icon" aria-hidden="true">⏳</div>
        <p class="pending-title">Application submitted</p>
        <p class="pending-desc">Thank you, <strong>{{ fullName }}</strong>. Our team will verify your credentials within 48 hours. You'll receive an activation email once approved.</p>
        <div class="pending-info">
          <span class="pending-info__item">✓ Professional details captured</span>
          <span class="pending-info__item">✓ Credentials recorded</span>
          <span class="pending-info__item">✓ Terms agreed</span>
          <span class="pending-info__item">◎ Admin verification pending</span>
        </div>
      </div>
    }
  }

</lc-onboarding-shell>
```

Create `src/app/features/auth/onboarding/professional/professional-onboarding.component.scss` as a copy of `ngo-onboarding.component.scss`:

```bash
cp "src/app/features/auth/onboarding/ngo/ngo-onboarding.component.scss" "src/app/features/auth/onboarding/professional/professional-onboarding.component.scss"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ng test --include='src/app/features/auth/onboarding/professional/professional-onboarding.component.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: PASS, all 7 tests green.

- [ ] **Step 5: Wire the onboarding route**

In `src/app/features/auth/auth.routes.ts`, add after the `onboarding/hmo` route:

```typescript
  {
    path: 'onboarding/professional',
    loadComponent: () =>
      import('./onboarding/professional/professional-onboarding.component').then(m => m.ProfessionalOnboardingComponent),
  },
```

- [ ] **Step 6: Commit**

```bash
git add src/app/features/auth/onboarding/professional src/app/features/auth/auth.routes.ts
git commit -m "feat: add professional onboarding flow"
```

---

### Task 10: Professional pending-status page

Build this before the portal shell since the portal's routes redirect here.

**Files:**
- Create: `src/app/features/professional/pending/professional-pending.component.ts` (inline template/styles, mirroring the existing `ComingSoonComponent` convention for small one-off views)
- Test: `src/app/features/professional/pending/professional-pending.component.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/features/professional/pending/professional-pending.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ProfessionalPendingComponent } from './professional-pending.component';
import { AuthService } from '../../../core/auth/auth.service';
import { ProfessionalApplicationsService } from '../../../core/applications/professional-applications.service';
import { User } from '../../../core/auth/auth.models';

describe('ProfessionalPendingComponent', () => {
  let fixture: ComponentFixture<ProfessionalPendingComponent>;

  function setup(user: User | null): ProfessionalApplicationsService {
    const authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'signup', 'signOut', 'isAuthenticated', 'role'], {
      user: signal(user),
    });
    TestBed.configureTestingModule({
      imports: [ProfessionalPendingComponent],
      providers: [{ provide: AuthService, useValue: authSpy }],
    });
    fixture = TestBed.createComponent(ProfessionalPendingComponent);
    return TestBed.inject(ProfessionalApplicationsService);
  }

  it('creates', () => {
    setup(null);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows a pending message while the application is under review', () => {
    const apps = setup({ id: '1', role: 'professional', name: 'Dr. Jane', email: 'jane@doe.com', status: 'pending' });
    apps.submit({
      fullName: 'Dr. Jane', email: 'jane@doe.com', phone: '0800', profession: 'Doctor',
      licenseNumber: 'LIC-1', specialty: 'Cardiology', yearsOfExperience: 5, bio: 'bio', docs: [],
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.title).toBe('Verification in progress');
  });

  it('shows the rejection reason when the application was rejected', () => {
    const apps = setup({ id: '1', role: 'professional', name: 'Dr. Jane', email: 'jane@doe.com', status: 'pending' });
    apps.submit({
      fullName: 'Dr. Jane', email: 'jane@doe.com', phone: '0800', profession: 'Doctor',
      licenseNumber: 'LIC-1', specialty: 'Cardiology', yearsOfExperience: 5, bio: 'bio', docs: [],
    });
    apps.reject(apps.applications()[0].id, 'Licence could not be verified');
    fixture.detectChanges();
    expect(fixture.componentInstance.title).toBe('Application rejected');
    expect(fixture.componentInstance.description).toBe('Licence could not be verified');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test --include='src/app/features/professional/pending/professional-pending.component.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: FAIL — cannot find module `./professional-pending.component`.

- [ ] **Step 3: Implement the component**

Create `src/app/features/professional/pending/professional-pending.component.ts`:

```typescript
import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { ProfessionalApplicationsService } from '../../../core/applications/professional-applications.service';

@Component({
  selector: 'lc-professional-pending',
  standalone: true,
  template: `
    <div class="pending-page">
      <div class="pending-page__icon" aria-hidden="true">{{ icon }}</div>
      <h1 class="pending-page__title">{{ title }}</h1>
      <p class="pending-page__desc">{{ description }}</p>
    </div>
  `,
  styles: [`
    .pending-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      gap: var(--space-4);
      text-align: center;
      padding: var(--space-12);
    }
    .pending-page__icon { font-size: 48px; }
    .pending-page__title {
      font-size: var(--text-xl);
      font-weight: var(--font-extrabold);
      color: var(--color-text);
      margin: 0;
    }
    .pending-page__desc {
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      max-width: 420px;
      margin: 0;
    }
  `],
})
export class ProfessionalPendingComponent {
  private readonly auth = inject(AuthService);
  private readonly apps = inject(ProfessionalApplicationsService);

  private get application() {
    return this.apps.findByEmail(this.auth.user()?.email ?? '');
  }

  get icon(): string {
    return this.application?.status === 'rejected' ? '✕' : '⏳';
  }

  get title(): string {
    return this.application?.status === 'rejected' ? 'Application rejected' : 'Verification in progress';
  }

  get description(): string {
    if (this.application?.status === 'rejected') {
      return this.application.rejectionReason || 'Your application was not approved. Contact support for more information.';
    }
    return 'Our team is reviewing your credentials. You will be able to access communities once your account is verified.';
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ng test --include='src/app/features/professional/pending/professional-pending.component.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/features/professional/pending
git commit -m "feat: add professional pending-verification status page"
```

---

### Task 11: Professional profile page

**Files:**
- Create: `src/app/features/professional/profile/professional-profile.component.ts`
- Create: `src/app/features/professional/profile/professional-profile.component.html`
- Create: `src/app/features/professional/profile/professional-profile.component.scss`
- Test: `src/app/features/professional/profile/professional-profile.component.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/features/professional/profile/professional-profile.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ProfessionalProfileComponent } from './professional-profile.component';
import { AuthService } from '../../../core/auth/auth.service';
import { ProfessionalApplicationsService } from '../../../core/applications/professional-applications.service';
import { User } from '../../../core/auth/auth.models';

describe('ProfessionalProfileComponent', () => {
  let fixture: ComponentFixture<ProfessionalProfileComponent>;
  let component: ProfessionalProfileComponent;
  let apps: ProfessionalApplicationsService;

  const mockUser: User = { id: '1', role: 'professional', name: 'Dr. Jane Doe', email: 'jane@doe.com', status: 'active' };

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'signup', 'signOut', 'isAuthenticated', 'role'], {
      user: signal(mockUser),
    });
    TestBed.configureTestingModule({
      imports: [ProfessionalProfileComponent],
      providers: [{ provide: AuthService, useValue: authSpy }],
    });
    fixture = TestBed.createComponent(ProfessionalProfileComponent);
    component = fixture.componentInstance;
    apps = TestBed.inject(ProfessionalApplicationsService);
    apps.submit({
      fullName: 'Dr. Jane Doe', email: 'jane@doe.com', phone: '0800', profession: 'Doctor',
      licenseNumber: 'LIC-1', specialty: 'Cardiology', yearsOfExperience: 5, bio: 'Original bio', docs: [],
    });
    apps.approve(apps.applications()[0].id);
    fixture.detectChanges();
  });

  it('creates', () => expect(component).toBeTruthy());

  it('shows the current application for the signed-in professional', () => {
    expect(component.application?.specialty).toBe('Cardiology');
  });

  it('saves an edited bio', () => {
    component.startEditBio();
    component.bioDraft.set('Updated bio');
    component.saveBio();
    expect(component.application?.bio).toBe('Updated bio');
    expect(component.editingBio()).toBeFalse();
  });

  it('cancelEditBio() discards the draft', () => {
    component.startEditBio();
    component.bioDraft.set('Discarded draft');
    component.cancelEditBio();
    expect(component.application?.bio).toBe('Original bio');
    expect(component.editingBio()).toBeFalse();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test --include='src/app/features/professional/profile/professional-profile.component.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: FAIL — cannot find module `./professional-profile.component`.

- [ ] **Step 3: Implement the component**

Create `src/app/features/professional/profile/professional-profile.component.ts`:

```typescript
import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { ProfessionalApplicationsService, ProfessionalApplication } from '../../../core/applications/professional-applications.service';

@Component({
  selector: 'lc-professional-profile',
  standalone: true,
  templateUrl: './professional-profile.component.html',
  styleUrl: './professional-profile.component.scss',
})
export class ProfessionalProfileComponent {
  private readonly auth = inject(AuthService);
  private readonly apps = inject(ProfessionalApplicationsService);

  readonly editingBio = signal(false);
  readonly bioDraft   = signal('');

  get application(): ProfessionalApplication | undefined {
    return this.apps.findByEmail(this.auth.user()?.email ?? '');
  }

  startEditBio(): void {
    this.bioDraft.set(this.application?.bio ?? '');
    this.editingBio.set(true);
  }

  saveBio(): void {
    const app = this.application;
    if (!app) return;
    this.apps.updateBio(app.id, this.bioDraft());
    this.editingBio.set(false);
  }

  cancelEditBio(): void {
    this.editingBio.set(false);
  }
}
```

Create `src/app/features/professional/profile/professional-profile.component.html`:

```html
<div class="profile-page">
  @if (application) {
    <div class="page-header">
      <div>
        <h1 class="page-header__title">My Profile</h1>
        <p class="page-header__sub">Your verified credentials, as reviewed by Lucen Care</p>
      </div>
      <span class="status-badge status-badge--{{ application.status }}">
        {{ application.status === 'approved' ? '✓ Verified Health Professional' : application.status }}
      </span>
    </div>

    <div class="profile-card">
      <p class="profile-card__title">Credentials</p>
      <dl class="detail-list">
        <dt>Full Name</dt><dd>{{ application.fullName }}</dd>
        <dt>Profession</dt><dd>{{ application.profession }}</dd>
        <dt>Specialty</dt><dd>{{ application.specialty }}</dd>
        <dt>Licence Number</dt><dd>{{ application.licenseNumber }}</dd>
        <dt>Years of Experience</dt><dd>{{ application.yearsOfExperience }}</dd>
        <dt>Email</dt><dd>{{ application.email }}</dd>
        <dt>Phone</dt><dd>{{ application.phone }}</dd>
      </dl>
    </div>

    <div class="profile-card">
      <p class="profile-card__title">Bio</p>
      @if (!editingBio()) {
        <p class="profile-card__bio">{{ application.bio }}</p>
        <button class="btn-ghost" type="button" (click)="startEditBio()">Edit bio</button>
      } @else {
        <textarea
          class="profile-card__bio-input"
          rows="4"
          [value]="bioDraft()"
          (input)="bioDraft.set($any($event.target).value)">
        </textarea>
        <div class="profile-card__actions">
          <button class="btn-ghost" type="button" (click)="cancelEditBio()">Cancel</button>
          <button class="btn-approve" type="button" (click)="saveBio()">Save</button>
        </div>
      }
    </div>
  }
</div>
```

Create `src/app/features/professional/profile/professional-profile.component.scss`:

```scss
.profile-page {
  padding: var(--space-8) var(--space-10);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: 760px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);

  &__title {
    color: var(--color-text);
    font-size: var(--text-2xl);
    font-weight: var(--font-extrabold);
    letter-spacing: var(--tracking-tight);
    margin-bottom: var(--space-1);
  }
  &__sub { color: var(--color-text-muted); font-size: var(--text-sm); }
}

.status-badge {
  flex-shrink: 0;
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  padding: 4px 10px;
  border-radius: var(--radius-full);
  background: var(--color-role-surface);
  color: var(--color-role-accent);
  border: 1px solid var(--color-role-border);
}

.profile-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-5) var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);

  &__title {
    font-size: var(--text-xs);
    font-weight: var(--font-semibold);
    text-transform: uppercase;
    letter-spacing: var(--tracking-wide);
    color: var(--color-text-muted);
  }

  &__bio {
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
    line-height: 1.6;
  }

  &__bio-input {
    width: 100%;
    padding: var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-family: var(--font-family);
    color: var(--color-text);
    background: var(--color-bg);
    resize: vertical;
  }

  &__actions {
    display: flex;
    gap: var(--space-3);
    justify-content: flex-end;
  }
}

.detail-list {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-2) var(--space-4);
  font-size: var(--text-sm);

  dt { color: var(--color-text-muted); font-weight: var(--font-medium); }
  dd { color: var(--color-text); font-weight: var(--font-semibold); }
}

.btn-ghost {
  align-self: flex-start;
  padding: 8px var(--space-5);
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  cursor: pointer;

  &:hover { border-color: var(--color-text-muted); }
}

.btn-approve {
  padding: 8px var(--space-5);
  background: var(--color-role-accent);
  color: #FFFFFF;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  cursor: pointer;

  &:hover { opacity: 0.88; }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ng test --include='src/app/features/professional/profile/professional-profile.component.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/features/professional/profile
git commit -m "feat: add professional profile page"
```

---

### Task 12: Professional portal shell and routing

This wires together Tasks 4, 10, and 11 into a working `/professional/*` portal, reusing the patient `CommunityComponent` for the community view.

**Files:**
- Create: `src/app/features/professional/professional-portal.component.ts`
- Create: `src/app/features/professional/professional.routes.ts`
- Modify: `src/app/app.routes.ts`
- Test: `src/app/features/professional/professional-portal.component.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/features/professional/professional-portal.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProfessionalPortalComponent } from './professional-portal.component';

describe('ProfessionalPortalComponent', () => {
  let fixture: ComponentFixture<ProfessionalPortalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfessionalPortalComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(ProfessionalPortalComponent);
    fixture.detectChanges();
  });

  it('creates', () => expect(fixture.componentInstance).toBeTruthy());

  it('only exposes Community and My Profile in the nav — no dashboard or funding', () => {
    const labels = fixture.componentInstance.navItems.map(i => i.label);
    expect(labels).toEqual(['Community', 'My Profile']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test --include='src/app/features/professional/professional-portal.component.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: FAIL — cannot find module `./professional-portal.component`.

- [ ] **Step 3: Implement the portal shell**

Create `src/app/features/professional/professional-portal.component.ts`:

```typescript
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarShellComponent, NavItem } from '../../shared/layout/sidebar-shell/sidebar-shell.component';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'lc-professional-portal',
  standalone: true,
  imports: [SidebarShellComponent],
  template: `
    <lc-sidebar-shell
      portalLabel="Professional Portal"
      portalClass="portal-professional"
      [userName]="userName"
      [userInitial]="userInitial"
      userRole="Healthcare Professional"
      [navItems]="navItems"
      (signOut)="handleSignOut()">
    </lc-sidebar-shell>
  `,
})
export class ProfessionalPortalComponent {
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  readonly navItems: NavItem[] = [
    { icon: '🤝', label: 'Community',  route: '/professional/community' },
    { icon: '⚕️', label: 'My Profile', route: '/professional/profile' },
  ];

  get userName(): string    { return this.auth.user()?.name ?? 'User'; }
  get userInitial(): string { return this.auth.user()?.name?.[0]?.toUpperCase() ?? 'U'; }

  handleSignOut(): void {
    this.auth.signOut();
    this.router.navigate(['/']);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ng test --include='src/app/features/professional/professional-portal.component.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: PASS

- [ ] **Step 5: Create the route table**

Create `src/app/features/professional/professional.routes.ts`:

```typescript
import { Routes } from '@angular/router';
import { ProfessionalPortalComponent } from './professional-portal.component';
import { professionalApprovedGuard } from '../../core/auth/professional-approved.guard';

export const PROFESSIONAL_ROUTES: Routes = [
  {
    path: '',
    component: ProfessionalPortalComponent,
    children: [
      { path: '', redirectTo: 'community', pathMatch: 'full' },
      {
        path: 'pending',
        loadComponent: () =>
          import('./pending/professional-pending.component').then(m => m.ProfessionalPendingComponent),
      },
      {
        path: 'community',
        canActivate: [professionalApprovedGuard],
        loadComponent: () =>
          import('../patient/community/community.component').then(m => m.CommunityComponent),
      },
      {
        path: 'profile',
        canActivate: [professionalApprovedGuard],
        loadComponent: () =>
          import('./profile/professional-profile.component').then(m => m.ProfessionalProfileComponent),
      },
    ],
  },
];
```

- [ ] **Step 6: Wire it into the top-level router**

In `src/app/app.routes.ts`, add a new top-level route after `hmo` (before `admin`):

```typescript
  {
    path: 'professional',
    loadChildren: () =>
      import('./features/professional/professional.routes').then(m => m.PROFESSIONAL_ROUTES),
  },
```

- [ ] **Step 7: Manually verify the end-to-end flow in the browser**

Run: `npx ng serve` and in the browser:
1. Go to `/` → role selection → select "Healthcare Professional" → sign up.
2. Complete the 4-step onboarding wizard; confirm it submits and returns to `/`.
3. Go to `/auth/professional/login`, sign in with the same email — confirm you land on `/professional/pending` (since the application has not been approved yet).
4. Go to `/admin`, log in as admin, open "Professional Approvals", approve the application.
5. Log in again as the professional — confirm you land on `/professional/community` and see the shared community feed with only "Community" and "My Profile" in the sidebar.

Expected: all five steps behave as described, with no console errors.

- [ ] **Step 8: Commit**

```bash
git add src/app/features/professional/professional-portal.component.ts src/app/features/professional/professional-portal.component.spec.ts src/app/features/professional/professional.routes.ts src/app/app.routes.ts
git commit -m "feat: add professional portal shell and routing"
```

---

### Task 13: Verified-professional badge in the community feed

**Files:**
- Modify: `src/app/features/patient/community/community.component.ts`
- Modify: `src/app/features/patient/community/community.component.html`
- Modify: `src/app/features/patient/community/community.component.scss`
- Test: `src/app/features/patient/community/community.component.spec.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `src/app/features/patient/community/community.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CommunityComponent } from './community.component';
import { AuthService } from '../../../core/auth/auth.service';
import { ProfessionalApplicationsService } from '../../../core/applications/professional-applications.service';
import { User } from '../../../core/auth/auth.models';

describe('CommunityComponent', () => {
  let fixture: ComponentFixture<CommunityComponent>;
  let component: CommunityComponent;

  function setup(user: User | null): void {
    const authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'signup', 'signOut', 'isAuthenticated', 'role'], {
      user: signal(user),
    });
    TestBed.configureTestingModule({
      imports: [CommunityComponent],
      providers: [{ provide: AuthService, useValue: authSpy }],
    });
    fixture = TestBed.createComponent(CommunityComponent);
    component = fixture.componentInstance;
  }

  it('creates', () => {
    setup(null);
    expect(component).toBeTruthy();
  });

  it('tags a new post from an approved professional with the verified badge', () => {
    const profUser: User = { id: '1', role: 'professional', name: 'Dr. Jane Doe', email: 'jane@doe.com', status: 'active' };
    setup(profUser);
    const profApps = TestBed.inject(ProfessionalApplicationsService);
    profApps.submit({
      fullName: 'Dr. Jane Doe', email: 'jane@doe.com', phone: '0800', profession: 'Doctor',
      licenseNumber: 'LIC-1', specialty: 'Cardiology', yearsOfExperience: 5, bio: 'bio', docs: [],
    });
    profApps.approve(profApps.applications()[0].id);

    component.addPost({ groupId: 'diabetes', groupLabel: 'Diabetes Support', groupColor: '#D97706', title: 'Title', content: 'Content', tags: [] });

    const post = component.posts()[0];
    expect(post.authorBadge).toBe('verified-professional');
    expect(post.authorSpecialty).toBe('Cardiology');
    expect(post.author).toBe('Dr. Jane Doe');
  });

  it('does not tag a post from a patient', () => {
    const patientUser: User = { id: '2', role: 'patient', name: 'Amaka', email: 'amaka@test.com', status: 'active' };
    setup(patientUser);
    component.addPost({ groupId: 'diabetes', groupLabel: 'Diabetes Support', groupColor: '#D97706', title: 'Title', content: 'Content', tags: [] });
    const post = component.posts()[0];
    expect(post.authorBadge).toBeUndefined();
  });

  it('does not tag a post from a professional whose application is still pending', () => {
    const profUser: User = { id: '1', role: 'professional', name: 'Dr. Jane Doe', email: 'jane@doe.com', status: 'pending' };
    setup(profUser);
    const profApps = TestBed.inject(ProfessionalApplicationsService);
    profApps.submit({
      fullName: 'Dr. Jane Doe', email: 'jane@doe.com', phone: '0800', profession: 'Doctor',
      licenseNumber: 'LIC-1', specialty: 'Cardiology', yearsOfExperience: 5, bio: 'bio', docs: [],
    });

    component.addPost({ groupId: 'diabetes', groupLabel: 'Diabetes Support', groupColor: '#D97706', title: 'Title', content: 'Content', tags: [] });
    const post = component.posts()[0];
    expect(post.authorBadge).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test --include='src/app/features/patient/community/community.component.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: FAIL — `authorBadge`/`authorSpecialty` do not exist on `CommunityPost`, and posts always default to author `'You'`.

- [ ] **Step 3: Extend the model and `addPost()` logic**

In `src/app/features/patient/community/community.component.ts`, change the `CommunityPost` interface:

```typescript
interface CommunityPost {
  id: string;
  author: string;
  authorInitial: string;
  authorColor: string;
  authorBadge?: 'verified-professional';
  authorSpecialty?: string;
  groupId: string;
  groupLabel: string;
  groupColor: string;
  timeAgo: string;
  title: string;
  content: string;
  likes: number;
  comments: number;
  liked: boolean;
  tags: string[];
}
```

Add a demo professional post to `SEED_POSTS` (insert as a new array entry, e.g. after `c1`):

```typescript
  {
    id: 'c1b',
    author: 'Dr. Yemi Adekunle', authorInitial: 'Y', authorColor: '#16A34A',
    authorBadge: 'verified-professional', authorSpecialty: 'Endocrinology',
    groupId: 'diabetes', groupLabel: 'Diabetes Support', groupColor: '#D97706',
    timeAgo: '6 hours ago',
    title: 'Clinical note: when persistent Metformin GI side effects are worth a dose review',
    content: "As an endocrinologist, I often see patients give up on Metformin too early because of GI discomfort. A few practical thresholds for when this is worth raising with your care team rather than just pushing through it.",
    likes: 64, comments: 12, liked: false,
    tags: ['Metformin', 'ClinicalAdvice', 'Diabetes'],
  },
```

Update the imports and component class to compute author metadata from the signed-in user:

```typescript
import { Component, computed, inject, signal } from '@angular/core';
import { NewPostModalComponent, NewPostData } from './new-post-modal.component';
import { CreateCommunityModalComponent, CreateCommunityData } from './create-community-modal.component';
import { AuthService } from '../../../core/auth/auth.service';
import { ProfessionalApplicationsService } from '../../../core/applications/professional-applications.service';
```

```typescript
export class CommunityComponent {
  private readonly auth     = inject(AuthService);
  private readonly profApps = inject(ProfessionalApplicationsService);

  readonly showNewPost = signal(false);
  readonly showCreateCommunity = signal(false);
  // ...unchanged signals (posts, groups, activeFilter, trending, filters, filteredPosts, joinedCount, stats)...
```

Replace the `addPost` method:

```typescript
  addPost(data: NewPostData): void {
    const meta = this.currentAuthorMeta();
    const post: CommunityPost = {
      id: crypto.randomUUID(),
      author: meta.name,
      authorInitial: meta.initial,
      authorColor: meta.color,
      authorBadge: meta.badge,
      authorSpecialty: meta.specialty,
      groupId: data.groupId,
      groupLabel: data.groupLabel,
      groupColor: data.groupColor,
      timeAgo: 'Just now',
      title: data.title,
      content: data.content,
      likes: 0,
      comments: 0,
      liked: false,
      tags: data.tags,
    };
    this.posts.update(list => [post, ...list]);
    this.setFilter('all');
  }

  private currentAuthorMeta(): { name: string; initial: string; color: string; badge?: 'verified-professional'; specialty?: string } {
    const user = this.auth.user();
    if (user?.role === 'professional') {
      const application = this.profApps.findByEmail(user.email);
      if (application?.status === 'approved') {
        return {
          name: user.name,
          initial: user.name.charAt(0).toUpperCase(),
          color: 'var(--color-role-accent)',
          badge: 'verified-professional',
          specialty: application.specialty,
        };
      }
    }
    return {
      name: user?.name ?? 'You',
      initial: (user?.name ?? 'Y').charAt(0).toUpperCase(),
      color: 'var(--color-role-accent)',
    };
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ng test --include='src/app/features/patient/community/community.component.spec.ts' --watch=false --browsers=ChromeHeadless`
Expected: PASS, all 4 tests green.

- [ ] **Step 5: Render the badge in the template**

In `src/app/features/patient/community/community.component.html`, inside `.post-card__author-info` (after the `post-card__time` span), add:

```html
              <div class="post-card__author-info">
                <span class="post-card__author">{{ post.author }}</span>
                <span class="post-card__time">{{ post.timeAgo }}</span>
                @if (post.authorBadge === 'verified-professional') {
                  <span
                    class="post-card__pro-badge"
                    [attr.title]="post.authorSpecialty ? 'Verified Health Professional · ' + post.authorSpecialty : 'Verified Health Professional'">
                    ✓ Verified Health Professional
                  </span>
                }
              </div>
```

- [ ] **Step 6: Style the badge**

In `src/app/features/patient/community/community.component.scss`, inside the `.post-card` block, add a new nested rule after `&__group-badge`:

```scss
  &__pro-badge {
    align-self: flex-start;
    font-size: 10px;
    font-weight: var(--font-bold);
    padding: 2px 8px;
    border-radius: var(--radius-full);
    background: rgba(22, 163, 74, 0.10);
    color: #15803D;
    border: 1px solid rgba(22, 163, 74, 0.25);
    margin-top: 2px;
  }
```

- [ ] **Step 7: Run the full suite once to confirm no regressions**

Run: `npx ng test --watch=false --browsers=ChromeHeadless`
Expected: PASS across the whole project.

- [ ] **Step 8: Commit**

```bash
git add src/app/features/patient/community
git commit -m "feat: show verified-professional badge on community posts"
```

---

## Self-review notes

- **Spec coverage:** Role/data model → Task 1, 3; verification flow (signup→admin review) → Tasks 5, 6, 8, 9; community badge → Task 13; portal & navigation → Tasks 10, 11, 12. All four design sections have corresponding tasks.
- **Cross-cutting consistency:** `Role`, `ProfessionalApplication`, `AuditSubjectType` and the `professionalApprovedGuard` are defined once (Tasks 1, 2, 3, 4) and only ever imported afterward — no redefinition drift.
- **Out of scope, by design:** admin dashboard stat cards, credential re-verification/expiry, moderation tooling — none of these are touched, matching the spec's non-goals.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-16-verified-healthcare-professionals.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
