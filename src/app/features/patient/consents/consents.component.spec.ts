import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { PatientConsentsComponent } from './consents.component';
import { environment } from '../../../../environments/environment';

const CONSENTS = `${environment.apiUrl}/consents/me`;
const GRANT_ID = '01GRANT00000000000000001';

function grant(over: Record<string, unknown> = {}) {
  return {
    id: GRANT_ID,
    purpose: 'ngo_funding',
    status: 'not_granted',
    dataScopes: ['name', 'conditionTags'],
    ...over,
  };
}

describe('PatientConsentsComponent', () => {
  let fixture: ComponentFixture<PatientConsentsComponent>;
  let component: PatientConsentsComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [PatientConsentsComponent, HttpClientTestingModule],
      // The page carries a back link to the settings landing, so RouterLink needs a router.
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientConsentsComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function init(grants: unknown[] = [grant()]) {
    fixture.detectChanges();
    http.expectOne(r => r.url === CONSENTS).flush({ data: grants, traceId: 't' });
    fixture.detectChanges();
  }

  function rowFor(purpose: string) {
    return component.rows().find(r => r.purpose === purpose)!;
  }

  // Research recruitment and HMO care are hidden until those features ship — a
  // consent toggle nothing can act on asks the patient to decide something meaningless.
  it('lists only the purposes that are actually implemented', () => {
    init([grant()]);
    expect(component.rows().map(r => r.purpose)).toEqual(['ngo_funding']);
  });

  it('lists a purpose the patient has no grant row for', () => {
    init([]);
    expect(component.rows().length).toBe(1);
    expect(rowFor('ngo_funding').grant).toBeUndefined();
  });

  it('shows what would be shared even before granting', () => {
    init([]);
    // Falls back to the canonical scopes so the patient can decide informed.
    expect(rowFor('ngo_funding').scopes.length).toBeGreaterThan(0);
  });

  // The whole point of this screen: a purpose declined at onboarding was permanent.
  describe('granting a declined purpose', () => {
    it('offers Allow sharing on a not_granted grant', () => {
      init([grant({ status: 'not_granted' })]);
      expect(rowFor('ngo_funding').canGrant).toBeTrue();
      expect(fixture.nativeElement.textContent).toContain('Allow sharing');
    });

    it('PATCHes the existing row to active rather than creating a duplicate', () => {
      init([grant({ status: 'not_granted' })]);

      component.grant(rowFor('ngo_funding'));

      const req = http.expectOne(`${environment.apiUrl}/consents/${GRANT_ID}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ status: 'active' });
      req.flush({ data: grant({ status: 'active' }), traceId: 't' });

      expect(rowFor('ngo_funding').canPause).toBeTrue();
    });

    it('POSTs with canonical scopes when there is no grant row at all', () => {
      init([]);

      component.grant(rowFor('ngo_funding'));

      const req = http.expectOne(`${environment.apiUrl}/consents`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.purpose).toBe('ngo_funding');
      // The backend rejects an empty array (@ArrayMinSize(1)).
      expect(req.request.body.dataScopes.length).toBeGreaterThan(0);
      req.flush({ data: grant({ status: 'active' }), traceId: 't' });
    });

    it('surfaces a failure instead of silently doing nothing', () => {
      init([grant({ status: 'not_granted' })]);

      component.grant(rowFor('ngo_funding'));
      http.expectOne(`${environment.apiUrl}/consents/${GRANT_ID}`).flush(
        { status: 409, message: 'Invalid state transition' },
        { status: 409, statusText: 'Conflict' },
      );
      fixture.detectChanges();

      expect(component.actionError()).toBeTruthy();
      expect(component.busyId()).toBeNull();
    });
  });

  describe('available actions follow the backend state machine', () => {
    it('an active grant can pause and revoke but not grant again', () => {
      init([grant({ status: 'active' })]);
      const row = rowFor('ngo_funding');
      expect(row.canGrant).toBeFalse();
      expect(row.canPause).toBeTrue();
      expect(row.canRevoke).toBeTrue();
    });

    it('a paused grant can resume or revoke', () => {
      init([grant({ status: 'paused' })]);
      const row = rowFor('ngo_funding');
      expect(row.canGrant).toBeTrue();
      expect(row.canRevoke).toBeTrue();
    });

    it('a revoked grant offers nothing but re-granting', () => {
      init([grant({ status: 'revoked' })]);
      const row = rowFor('ngo_funding');
      expect(row.canPause).toBeFalse();
      expect(row.canRevoke).toBeFalse();
    });
  });

  // Revoking cascades, so the patient sees what it costs before confirming.
  describe('revoking', () => {
    it('previews the impact before asking to confirm', () => {
      init([grant({ status: 'active' })]);

      component.startRevoke(rowFor('ngo_funding'));

      http.expectOne(`${environment.apiUrl}/consents/${GRANT_ID}/impact`).flush({
        data: {
          affectedEnrollments: [{ id: 'E1', programId: 'P1', programTitle: 'Fund', status: 'active' }],
          affectedStudyEnrollments: [],
          totalAffected: 1,
        },
        traceId: 't',
      });
      fixture.detectChanges();

      expect(component.revokeMessage).toContain('1 programme application');
      expect(fixture.nativeElement.textContent).toContain('Revoke');
    });

    it('still allows revoking when the impact preview fails', () => {
      init([grant({ status: 'active' })]);

      component.startRevoke(rowFor('ngo_funding'));
      http.expectOne(`${environment.apiUrl}/consents/${GRANT_ID}/impact`).flush({}, { status: 500, statusText: 'Error' });
      fixture.detectChanges();

      expect(component.revoking()).not.toBeNull();
      expect(component.revokeMessage).toContain('cannot be undone');
    });

    it('confirming PATCHes to revoked and closes the dialog', () => {
      init([grant({ status: 'active' })]);
      component.startRevoke(rowFor('ngo_funding'));
      http.expectOne(`${environment.apiUrl}/consents/${GRANT_ID}/impact`).flush(
        { data: { affectedEnrollments: [], affectedStudyEnrollments: [], totalAffected: 0 }, traceId: 't' },
      );

      component.confirmRevoke();

      const req = http.expectOne(`${environment.apiUrl}/consents/${GRANT_ID}`);
      expect(req.request.body).toEqual({ status: 'revoked' });
      req.flush({ data: grant({ status: 'revoked' }), traceId: 't' });

      expect(component.revoking()).toBeNull();
    });
  });

  it('shows an error with retry when the list fails to load', () => {
    fixture.detectChanges();
    http.expectOne(r => r.url === CONSENTS).flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();

    expect(component.loadError()).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Could not load your privacy settings');
  });
});
