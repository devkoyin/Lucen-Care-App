import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BenefactorApplicationsService } from './benefactor-applications.service';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

const apiApp = {
  id: 'BEN1',
  userId: 'U1',
  status: 'pending' as const,
  submittedAt: '2026-03-12T09:24:00.000Z',
  fullName: 'Ada Obi',
  email: 'ada@test.com',
  phone: '0800',
  reasonForSupport: 'I want to help patients navigate the system.',
  idConsentGiven: true,
};

describe('BenefactorApplicationsService', () => {
  let svc: BenefactorApplicationsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BenefactorApplicationsService],
    });
    svc = TestBed.inject(BenefactorApplicationsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('creates', () => expect(svc).toBeTruthy());

  it('load() maps the joined applicant email onto the view model', () => {
    svc.load().subscribe();

    const req = http.expectOne(r => r.url === `${API}/admin/applications/benefactor`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: [apiApp], traceId: 't' });

    const [app] = svc.applications();
    expect(app.fullName).toBe('Ada Obi');
    expect(app.email).toBe('ada@test.com');
    expect(app.status).toBe('pending');
  });

  it('derives the ID-verification checklist from idConsentGiven', () => {
    svc.load().subscribe();
    http
      .expectOne(r => r.url === `${API}/admin/applications/benefactor`)
      .flush({ data: [{ ...apiApp, idConsentGiven: false }], traceId: 't' });

    expect(svc.applications()[0].docs[0].submitted).toBeFalse();
  });

  it('approve() PATCHes the review endpoint with an action field', () => {
    svc.approve('BEN1').subscribe();

    const req = http.expectOne(`${API}/admin/applications/benefactor/BEN1/review`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ action: 'approve' });
    req.flush({ data: {}, traceId: 't' });

    http
      .expectOne(r => r.url === `${API}/admin/applications/benefactor`)
      .flush({ data: [], traceId: 't' });
  });

  it('reject() sends the reason, which the API requires', () => {
    svc.reject('BEN1', 'Invalid ID').subscribe();

    const req = http.expectOne(`${API}/admin/applications/benefactor/BEN1/review`);
    expect(req.request.body).toEqual({ action: 'reject', reason: 'Invalid ID' });
    req.flush({ data: {}, traceId: 't' });

    http
      .expectOne(r => r.url === `${API}/admin/applications/benefactor`)
      .flush({ data: [], traceId: 't' });
  });

  it('submitToApi POSTs the onboarding payload with real consent values', () => {
    const payload = {
      fullName: 'Ada Obi',
      phone: '0800',
      reasonForSupport: 'I want to help patients navigate the system.',
      idConsent: true,
      termsConsent: true,
      codeOfConductConsent: true,
    };
    svc.submitToApi(payload).subscribe();

    const req = http.expectOne(`${API}/auth/onboarding/benefactor`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ data: { id: 'BEN1' }, traceId: 't' });
  });
});
