import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApplicationsService } from './applications.service';
import { AuditAction } from './audit-labels';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

const apiNgo = {
  id: 'ORG1',
  name: 'Hope Health Initiative',
  type: 'ngo',
  status: 'pending_verification',
  contactEmail: 'admin@hopehealth.org',
  contactPerson: 'Ada Okafor',
  createdAt: '2026-03-12T09:24:00.000Z',
  registrationNumber: 'RC-123456',
  tin: '01234567-0001',
  scumlNumber: 'SCUML-998877',
  focusAreas: 'Maternal health',
  operatingRegions: 'Lagos',
  headOfficeCountry: 'NG',
  programDescription: 'Community outreach',
};

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApplicationsService],
    });
    service = TestBed.inject(ApplicationsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('creates', () => expect(service).toBeTruthy());

  it('load() unwraps the response envelope and maps orgs into the view model', () => {
    service.load().subscribe();

    const req = http.expectOne(r => r.url === `${API}/organizations`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: [apiNgo], traceId: 't' });

    const [app] = service.applications();
    expect(app.orgName).toBe('Hope Health Initiative');
    expect(app.contactPerson).toBe('Ada Okafor');
    expect(app.registrationNo).toBe('RC-123456');
    expect(app.tin).toBe('01234567-0001');
    expect(app.scumlNumber).toBe('SCUML-998877');
  });

  it('maps pending_verification to the pending view status', () => {
    service.load().subscribe();
    http.expectOne(r => r.url === `${API}/organizations`).flush({ data: [apiNgo], traceId: 't' });

    expect(service.applications()[0].status).toBe('pending');
    expect(service.pendingCount('ngo')).toBe(1);
  });

  it('maps active to approved', () => {
    service.load().subscribe();
    http
      .expectOne(r => r.url === `${API}/organizations`)
      .flush({ data: [{ ...apiNgo, status: 'active' }], traceId: 't' });

    expect(service.applications()[0].status).toBe('approved');
    expect(service.pendingCount('ngo')).toBe(0);
  });

  it('derives the NGO document checklist from which fields were supplied', () => {
    service.load().subscribe();
    http
      .expectOne(r => r.url === `${API}/organizations`)
      .flush({ data: [{ ...apiNgo, tin: undefined }], traceId: 't' });

    const docs = service.applications()[0].docs;
    expect(docs.find(d => d.label === 'TIN')?.submitted).toBeFalse();
    expect(docs.find(d => d.label === 'SCUML Certificate No.')?.submitted).toBeTrue();
  });

  // Org review uses AdminApproveDto — { status, reason } — NOT { action, reason }.
  it('approve() PATCHes the org review endpoint with a status field', () => {
    service.approve('ORG1').subscribe();

    const req = http.expectOne(`${API}/admin/organizations/ORG1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'approved' });
    req.flush({ data: {}, traceId: 't' });

    // approve() refreshes the list afterwards
    http.expectOne(r => r.url === `${API}/organizations`).flush({ data: [], traceId: 't' });
  });

  it('reject() sends the reason alongside the rejected status', () => {
    service.reject('ORG1', 'Documents incomplete').subscribe();

    const req = http.expectOne(`${API}/admin/organizations/ORG1`);
    expect(req.request.body).toEqual({ status: 'rejected', reason: 'Documents incomplete' });
    req.flush({ data: {}, traceId: 't' });

    http.expectOne(r => r.url === `${API}/organizations`).flush({ data: [], traceId: 't' });
  });

  it('submitNgoToApi POSTs the onboarding payload and unwraps the envelope', () => {
    const payload = {
      orgName: 'Hope Health Initiative',
      registrationNumber: 'RC-123456',
      tin: '01234567-0001',
      scumlNumber: 'SCUML-998877',
      focusAreas: 'Maternal health',
      operatingRegions: 'Lagos',
      headOfficeCountry: 'NG',
      programDescription: 'Community outreach',
      termsConsent: true,
      dataProcessingConsent: true,
    };
    let result: unknown;
    service.submitNgoToApi(payload).subscribe(r => (result = r));

    const req = http.expectOne(`${API}/auth/onboarding/ngo`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ data: { id: 'ORG1' }, traceId: 't' });

    expect(result).toEqual({ id: 'ORG1' });
  });

  // Matched by predicate, not exact string: expectOne(string) compares
  // urlWithParams, and loadAuditLog now always sends ?limit=.
  it('loadAuditLog maps backend audit actions onto the view model', () => {
    service.loadAuditLog().subscribe();

    http.expectOne(r => r.url === `${API}/admin/audit`).flush({
      data: [
        {
          id: 'AUD1',
          actorId: 'U1',
          actorName: 'Admin Taiwo',
          action: 'admin_approve',
          resourceId: 'ORG1',
          resourceType: 'organization',
          createdAt: '2026-03-15T14:00:00.000Z',
        },
      ],
      traceId: 't',
    });

    const [entry] = service.auditLog();
    expect(entry.action).toBe('approved');
    expect(entry.actor).toBe('Admin Taiwo');
    expect(entry.orgType).toBe('ngo');
  });

  describe('audit subject naming', () => {
    /** An audit row as GET /admin/audit returns it, post-enrichment. */
    function apiRow(overrides: Record<string, unknown> = {}) {
      return {
        id: 'A1',
        actorId: 'ADMIN1',
        actorName: 'Admin Taiwo',
        action: 'admin_approve',
        resourceId: '01KXR9EAGTZ9JZR0FFW6N24518',
        resourceType: 'organization',
        resourceName: 'Hope Health Initiative',
        resourceSubtype: 'ngo',
        createdAt: '2026-08-01T09:00:00.000Z',
        ...overrides,
      };
    }

    function flushAudit(rows: unknown[]) {
      service.loadAuditLog().subscribe();
      http.expectOne(r => r.url === `${API}/admin/audit`).flush({ data: rows, traceId: 't' });
    }

    it('prefers the server-resolved resourceName over the raw ULID', () => {
      flushAudit([apiRow()]);
      expect(service.auditLog()[0].orgName).toBe('Hope Health Initiative');
    });

    // Patient, medication and consent rows are deliberately left unnamed by the
    // backend allowlist, so the ULID is what the screen must fall back to.
    it('falls back to resourceId when the server withheld the name', () => {
      flushAudit([
        apiRow({
          action: 'export',
          resourceType: 'patient',
          resourceId: 'PAT_ULID_1',
          resourceName: undefined,
          resourceSubtype: undefined,
        }),
      ]);

      expect(service.auditLog()[0].orgName).toBe('PAT_ULID_1');
      expect(service.auditLog()[0].orgType).toBe('patient');
    });

    // The bug this closes: AUDIT_SUBJECT_MAP hardcoded organization -> 'ngo', so
    // every HMO approval rendered with an NGO badge.
    it('reads ngo/hmo from resourceSubtype instead of assuming ngo', () => {
      flushAudit([
        apiRow({ id: 'A1', resourceSubtype: 'ngo' }),
        apiRow({ id: 'A2', resourceSubtype: 'hmo', resourceName: 'Apex Health HMO' }),
      ]);

      expect(service.auditLog()[0].orgType).toBe('ngo');
      expect(service.auditLog()[1].orgType).toBe('hmo');
    });

    it('ignores an unrecognised subtype rather than mislabelling the row', () => {
      flushAudit([apiRow({ resourceSubtype: 'something_else' })]);
      expect(service.auditLog()[0].orgType).toBe('ngo'); // from resourceType
    });

    // The regression this closes: only 3 of 9 actions were mapped and the rest fell
    // through to 'submitted', so an export or a revocation read as "Submitted".
    it('maps every backend action to its own distinct label', () => {
      const cases: Array<[string, AuditAction]> = [
        ['application_submitted', 'submitted'],
        ['admin_approve', 'approved'],
        ['admin_reject', 'rejected'],
        ['export', 'exported'],
        ['revoke_consent', 'consent_revoked'],
        ['consent_change', 'consent_changed'],
        ['login', 'login'],
        ['cross_org_attempt', 'cross_org_attempt'],
        ['medication_refill_requested', 'refill_requested'],
      ];

      flushAudit(cases.map(([action], i) => apiRow({ id: `A${i}`, action })));

      const actual = service.auditLog().map(e => e.action);
      expect(actual).toEqual(cases.map(([, expected]) => expected));
      // No two actions collapse onto the same value.
      expect(new Set(actual).size).toBe(cases.length);
    });

    describe('loadRecentActivity', () => {
      it('requests only a short page', () => {
        service.loadRecentActivity().subscribe();
        const req = http.expectOne(r => r.url === `${API}/admin/audit`);
        expect(req.request.params.get('limit')).toBe('6');
        req.flush({ data: [apiRow()], traceId: 't' });
      });

      it('populates recentActivity without touching auditLog', () => {
        service.loadRecentActivity().subscribe();
        http.expectOne(r => r.url === `${API}/admin/audit`).flush({ data: [apiRow()], traceId: 't' });

        expect(service.recentActivity().length).toBe(1);
        // Sharing one signal would make the Audit Log page's event count read 6.
        expect(service.auditLog().length).toBe(0);
      });
    });

    describe('pagination', () => {
      it('stores the cursor from meta', () => {
        service.loadAuditLog().subscribe();
        http.expectOne(r => r.url === `${API}/admin/audit`).flush({
          data: [apiRow()],
          meta: { cursor: 'CURSOR_1', limit: 50 },
          traceId: 't',
        });

        expect(service.auditCursor()).toBe('CURSOR_1');
      });

      it('appends the next page instead of replacing it', () => {
        service.loadAuditLog().subscribe();
        http.expectOne(r => r.url === `${API}/admin/audit`).flush({
          data: [apiRow({ id: 'A1' })],
          meta: { cursor: 'CURSOR_1' },
          traceId: 't',
        });

        service.loadAuditLog({ cursor: 'CURSOR_1' }).subscribe();
        const req = http.expectOne(r => r.url === `${API}/admin/audit`);
        expect(req.request.params.get('cursor')).toBe('CURSOR_1');
        req.flush({ data: [apiRow({ id: 'A2' })], traceId: 't' });

        expect(service.auditLog().map(e => e.id)).toEqual(['A1', 'A2']);
        expect(service.auditCursor()).toBeUndefined();
      });

      it('replaces rather than appends when called with no cursor', () => {
        service.loadAuditLog().subscribe();
        http
          .expectOne(r => r.url === `${API}/admin/audit`)
          .flush({ data: [apiRow({ id: 'A1' })], traceId: 't' });

        service.loadAuditLog().subscribe();
        http
          .expectOne(r => r.url === `${API}/admin/audit`)
          .flush({ data: [apiRow({ id: 'A2' })], traceId: 't' });

        expect(service.auditLog().map(e => e.id)).toEqual(['A2']);
      });

      it('toggles the loading signal and clears it on error', () => {
        service.loadAuditLog().subscribe({ error: () => {} });
        expect(service.auditLoading()).toBeTrue();

        http
          .expectOne(r => r.url === `${API}/admin/audit`)
          .flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });

        expect(service.auditLoading()).toBeFalse();
      });
    });
  });

  // "Approved (30d)" must mean approved in the window, not registered in it.
  describe('recentCount', () => {
    const recent = new Date(Date.now() - 2 * 86400000).toISOString();
    const longAgo = new Date(Date.now() - 200 * 86400000).toISOString();

    function loadOrgs(rows: unknown[]) {
      service.load().subscribe();
      http.expectOne(r => r.url === `${API}/organizations`).flush({ data: rows, traceId: 't' });
    }

    it('counts an org approved inside the window but created long before it', () => {
      loadOrgs([{ ...apiNgo, status: 'active', createdAt: longAgo, verifiedAt: recent }]);
      expect(service.recentCount('approved', 30)).toBe(1);
    });

    it('excludes an org approved before the window even if recently created', () => {
      loadOrgs([{ ...apiNgo, status: 'active', createdAt: recent, verifiedAt: longAgo }]);
      expect(service.recentCount('approved', 30)).toBe(0);
    });

    it('falls back to the submission date when there is no review date', () => {
      loadOrgs([{ ...apiNgo, status: 'pending_verification', createdAt: recent }]);
      expect(service.recentCount('pending', 30)).toBe(1);
    });
  });
});
