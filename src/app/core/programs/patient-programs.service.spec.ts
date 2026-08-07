import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { PatientProgramsService } from './patient-programs.service';
import { environment } from '../../../environments/environment';

const BROWSE = `${environment.apiUrl}/programs/browse`;
const ENROLLMENTS = `${environment.apiUrl}/enrollments`;

const program = {
  id: '01PROGRAM0000000000000001',
  orgId: '01ORG00000000000000000001',
  title: 'Chronic Care Fund',
  type: 'ngo_funding',
  expiresAt: '2026-09-01T00:00:00.000Z',
};

function enrollment(over: Record<string, unknown> = {}) {
  return {
    id: '01ENROL000000000000000001',
    programId: program.id,
    status: 'active',
    createdAt: '2026-08-01T00:00:00.000Z',
    programTitle: 'Chronic Care Fund',
    programType: 'ngo_funding',
    programExpiresAt: '2026-09-01T00:00:00.000Z',
    ...over,
  };
}

describe('PatientProgramsService', () => {
  let service: PatientProgramsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(PatientProgramsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads browsable programmes', () => {
    service.loadPrograms().subscribe();
    const req = http.expectOne(r => r.url === BROWSE);
    expect(req.request.method).toBe('GET');
    req.flush({ data: [program], traceId: 't' });

    expect(service.programs().length).toBe(1);
    // The fields the select-bug used to drop.
    expect(service.programs()[0].orgId).toBe(program.orgId);
    expect(service.programs()[0].expiresAt).toBeTruthy();
  });

  // Applied state used to be a client-side Set that a refresh discarded.
  describe('appliedProgramIds', () => {
    function loadEnrollments(rows: unknown[]) {
      service.loadEnrollments().subscribe();
      http.expectOne(r => r.url === ENROLLMENTS).flush(
        { data: { enrollments: rows }, traceId: 't' },
      );
    }

    it('derives applied programmes from real enrollments', () => {
      loadEnrollments([enrollment()]);
      expect(service.isApplied(program.id)).toBeTrue();
    });

    it('does not count a withdrawn enrollment as applied', () => {
      loadEnrollments([enrollment({ status: 'revoked_by_patient' })]);
      expect(service.isApplied(program.id)).toBeFalse();
    });

    it('does not count an expired enrollment as applied', () => {
      loadEnrollments([enrollment({ status: 'expired' })]);
      expect(service.isApplied(program.id)).toBeFalse();
    });

    it('reports nothing applied before any load', () => {
      expect(service.isApplied(program.id)).toBeFalse();
    });
  });

  it('applies by posting the programme id', () => {
    service.apply(program.id).subscribe();
    const req = http.expectOne(ENROLLMENTS);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ programId: program.id });
    req.flush({ data: enrollment(), traceId: 't' });
  });

  it('loadAll fetches both feeds', () => {
    service.loadAll().subscribe();
    http.expectOne(r => r.url === BROWSE).flush({ data: [program], traceId: 't' });
    http.expectOne(r => r.url === ENROLLMENTS).flush({ data: { enrollments: [enrollment()] }, traceId: 't' });

    expect(service.programs().length).toBe(1);
    expect(service.isApplied(program.id)).toBeTrue();
  });
});
