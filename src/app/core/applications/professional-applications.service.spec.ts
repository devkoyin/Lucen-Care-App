import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProfessionalApplicationsService } from './professional-applications.service';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

const apiApp = {
  id: 'APP1',
  userId: 'U1',
  status: 'pending' as const,
  submittedAt: '2026-03-12T09:24:00.000Z',
  name: 'Dr. Jane Doe',
  email: 'jane@doe.com',
  phone: '08000000000',
  profession: 'Doctor' as const,
  licenseNumber: 'LIC-123',
  specialty: 'Cardiology',
  yearsOfExperience: 8,
  bio: 'Cardiologist with 8 years of clinical practice.',
};

describe('ProfessionalApplicationsService', () => {
  let service: ProfessionalApplicationsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProfessionalApplicationsService],
    });
    service = TestBed.inject(ProfessionalApplicationsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('creates', () => expect(service).toBeTruthy());

  it('load() maps the joined applicant identity onto the view model', () => {
    service.load().subscribe();

    const req = http.expectOne(r => r.url === `${API}/admin/applications/professional`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: [apiApp], traceId: 't' });

    const [app] = service.applications();
    // `name` and `email` are joined from users — the table has neither column.
    expect(app.fullName).toBe('Dr. Jane Doe');
    expect(app.email).toBe('jane@doe.com');
    expect(app.specialty).toBe('Cardiology');
  });

  it('falls back to the email when the applicant has no name', () => {
    service.load().subscribe();
    http
      .expectOne(r => r.url === `${API}/admin/applications/professional`)
      .flush({ data: [{ ...apiApp, name: undefined }], traceId: 't' });

    expect(service.applications()[0].fullName).toBe('jane@doe.com');
  });

  it('passes the status filter through as a query param', () => {
    service.load('approved').subscribe();

    const req = http.expectOne(r => r.url === `${API}/admin/applications/professional`);
    expect(req.request.params.get('status')).toBe('approved');
    req.flush({ data: [], traceId: 't' });
  });

  // Application review uses ReviewApplicationDto — { action, reason } — NOT { status }.
  it('approve() PATCHes the review endpoint with an action field', () => {
    service.approve('APP1').subscribe();

    const req = http.expectOne(`${API}/admin/applications/professional/APP1/review`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ action: 'approve' });
    req.flush({ data: {}, traceId: 't' });

    http
      .expectOne(r => r.url === `${API}/admin/applications/professional`)
      .flush({ data: [], traceId: 't' });
  });

  it('reject() sends the reason, which the API requires', () => {
    service.reject('APP1', 'Licence could not be verified').subscribe();

    const req = http.expectOne(`${API}/admin/applications/professional/APP1/review`);
    expect(req.request.body).toEqual({ action: 'reject', reason: 'Licence could not be verified' });
    req.flush({ data: {}, traceId: 't' });

    http
      .expectOne(r => r.url === `${API}/admin/applications/professional`)
      .flush({ data: [], traceId: 't' });
  });

  it('submitToApi POSTs the onboarding payload with real consent values', () => {
    const payload = {
      profession: 'Doctor' as const,
      licenseNumber: 'LIC-123',
      specialty: 'Cardiology',
      yearsOfExperience: 8,
      phone: '08000000000',
      bio: 'Cardiologist with 8 years of clinical practice.',
      termsConsent: true,
      codeOfConductConsent: true,
    };
    service.submitToApi(payload).subscribe();

    const req = http.expectOne(`${API}/auth/onboarding/professional`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ data: { id: 'APP1' }, traceId: 't' });
  });
});
