import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { environment } from '../../../../environments/environment';

const API = environment.apiUrl;
const ORGS_URL = `${API}/organizations`;
const AUDIT_URL = `${API}/admin/audit`;
const PROF_URL = `${API}/admin/applications/professional`;
const BEN_URL = `${API}/admin/applications/benefactor`;
const PROGRAMS_URL = `${API}/admin/programs`;

function auditRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'A1',
    actorId: 'ADMIN1',
    actorName: 'Admin Taiwo',
    action: 'admin_approve',
    resourceId: '01KXR9EAGTZ9JZR0FFW6N24518',
    resourceType: 'organization',
    resourceName: 'Hope Health Initiative',
    resourceSubtype: 'ngo',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    ...overrides,
  };
}

function apiOrg(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ORG1',
    name: 'Hope Health',
    type: 'ngo',
    status: 'pending_verification',
    contactEmail: 'ops@hope.test',
    createdAt: '2026-07-01T09:00:00.000Z',
    ...overrides,
  };
}

function apiProfessional(overrides: Record<string, unknown> = {}) {
  return {
    id: 'APP1', userId: 'U1', status: 'pending', submittedAt: '2026-07-01T09:00:00.000Z',
    name: 'Dr Ada Obi', email: 'ada@x.test', phone: '0800', profession: 'Doctor',
    licenseNumber: 'LIC-1', specialty: 'Cardiology', yearsOfExperience: 5, bio: 'bio',
    ...overrides,
  };
}

function apiBenefactor(overrides: Record<string, unknown> = {}) {
  return {
    id: 'BEN1', userId: 'U2', status: 'pending', submittedAt: '2026-07-01T09:00:00.000Z',
    fullName: 'Taiwo Balogun', email: 'taiwo@x.test', phone: '0801',
    reasonForSupport: 'Community', idConsentGiven: true,
    ...overrides,
  };
}

describe('AdminDashboardComponent', () => {
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let component: AdminDashboardComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent, HttpClientTestingModule],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  /** Runs ngOnInit and answers all five requests it fires. */
  function init(opts: {
    orgs?: unknown[];
    audit?: unknown[];
    professional?: unknown[];
    benefactor?: unknown[];
    programs?: unknown[];
  } = {}) {
    fixture.detectChanges();
    http.expectOne(r => r.url === ORGS_URL).flush({ data: opts.orgs ?? [], traceId: 't' });
    http.expectOne(r => r.url === AUDIT_URL).flush({ data: opts.audit ?? [], traceId: 't' });
    http.expectOne(r => r.url === PROF_URL).flush({ data: opts.professional ?? [], traceId: 't' });
    http.expectOne(r => r.url === BEN_URL).flush({ data: opts.benefactor ?? [], traceId: 't' });
    http.expectOne(r => r.url === PROGRAMS_URL).flush({ data: opts.programs ?? [], traceId: 't' });
    fixture.detectChanges();
  }

  it('creates', () => {
    init();
    expect(component).toBeTruthy();
  });

  describe('Recent Activity', () => {
    // This panel was a hardcoded array of six invented organisations.
    it('renders real audit events from the API', () => {
      init({ audit: [auditRow()] });

      expect(component.activity().length).toBe(1);
      const text = fixture.nativeElement.textContent as string;
      expect(text).toContain('Hope Health Initiative');
      expect(text).toContain('Admin Taiwo');
      // The mock's pre-baked '2 hours ago' is now computed from the real timestamp.
      expect(text).toContain('2h ago');
    });

    it('requests only a short page of activity', () => {
      fixture.detectChanges();
      http.expectOne(r => r.url === ORGS_URL).flush({ data: [], traceId: 't' });
      const req = http.expectOne(r => r.url === AUDIT_URL);
      expect(req.request.params.get('limit')).toBe('6');
      req.flush({ data: [], traceId: 't' });
      http.expectOne(r => r.url === PROF_URL).flush({ data: [], traceId: 't' });
      http.expectOne(r => r.url === BEN_URL).flush({ data: [], traceId: 't' });
      http.expectOne(r => r.url === PROGRAMS_URL).flush({ data: [], traceId: 't' });
    });

    // The mock could never be empty, so this state had no rendering at all.
    it('shows an empty state when there are no events', () => {
      init({ audit: [] });

      const text = fixture.nativeElement.textContent as string;
      expect(text).toContain('No activity yet');
      expect(fixture.nativeElement.querySelector('.activity-table')).toBeNull();
    });

    it('badges an HMO row as HMO, not NGO', () => {
      init({
        audit: [auditRow({ resourceSubtype: 'hmo', resourceName: 'Apex Health HMO' })],
      });

      expect(component.typeLabel(component.activity()[0].orgType)).toBe('HMO');
      expect(fixture.nativeElement.querySelector('.type-badge--hmo')).not.toBeNull();
    });

    it('labels a non-review action honestly instead of "Submitted"', () => {
      init({
        audit: [
          auditRow({ action: 'revoke_consent', resourceType: 'ConsentGrant', resourceName: undefined, resourceSubtype: undefined }),
        ],
      });

      expect(component.actionLabel(component.activity()[0].action)).toBe('Consent revoked');
      expect(fixture.nativeElement.textContent).toContain('Consent revoked');
    });

    it('falls back to the resourceId when the server withheld the name', () => {
      init({
        audit: [
          auditRow({
            action: 'export',
            resourceType: 'patient',
            resourceId: 'PAT_ULID_1',
            resourceName: undefined,
            resourceSubtype: undefined,
          }),
        ],
      });

      expect(component.activity()[0].orgName).toBe('PAT_ULID_1');
    });
  });

  describe('stats', () => {
    it('counts pending professionals and benefactors alongside orgs', () => {
      init({
        orgs: [apiOrg(), apiOrg({ id: 'ORG2', type: 'hmo' })],
        professional: [apiProfessional(), apiProfessional({ id: 'APP2', status: 'approved' })],
        benefactor: [apiBenefactor()],
      });

      const byLabel = new Map(component.stats.map(s => [s.label, s.value]));
      expect(byLabel.get('Pending NGOs')).toBe(1);
      expect(byLabel.get('Pending HMOs')).toBe(1);
      // These two were never counted before, despite having their own nav items.
      expect(byLabel.get('Pending Professionals')).toBe(1);
      expect(byLabel.get('Pending Benefactors')).toBe(1);
    });

    it('renders a card per queue, including programmes', () => {
      init();
      expect(component.stats.length).toBe(7);
      expect(fixture.nativeElement.querySelectorAll('.stat-card').length).toBe(7);
      expect(fixture.nativeElement.textContent).toContain('Pending Programmes');
    });

    // Programmes were the one reviewable thing with no admin surface at all.
    it('counts programmes awaiting review', () => {
      init({
        programs: [
          { id: 'P1', status: 'pending_review', title: 'A', orgName: 'Hope', eligibilityCriteria: [] },
          { id: 'P2', status: 'approved', title: 'B', orgName: 'Hope', eligibilityCriteria: [] },
        ],
      });

      expect(component.programPendingCount).toBe(1);
    });

    // Deliberately load() and not load('pending'), so the approvals pages that share
    // these signals still see approved and rejected rows.
    it('loads the full application lists, not just pending ones', () => {
      fixture.detectChanges();
      http.expectOne(r => r.url === ORGS_URL).flush({ data: [], traceId: 't' });
      http.expectOne(r => r.url === AUDIT_URL).flush({ data: [], traceId: 't' });

      const prof = http.expectOne(r => r.url === PROF_URL);
      expect(prof.request.params.has('status')).toBeFalse();
      prof.flush({ data: [], traceId: 't' });

      http.expectOne(r => r.url === PROGRAMS_URL).flush({ data: [], traceId: 't' });

      const ben = http.expectOne(r => r.url === BEN_URL);
      expect(ben.request.params.has('status')).toBeFalse();
      ben.flush({ data: [], traceId: 't' });
    });
  });

  it('survives every request failing', () => {
    fixture.detectChanges();
    for (const url of [ORGS_URL, AUDIT_URL, PROF_URL, BEN_URL, PROGRAMS_URL]) {
      http
        .expectOne(r => r.url === url)
        .flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
    }
    fixture.detectChanges();

    expect(component.activity().length).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('No activity yet');
  });
});
