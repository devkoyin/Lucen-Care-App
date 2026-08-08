import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { BenefactorApprovalsComponent } from './benefactor-approvals.component';
import { BenefactorApplicationsService } from '../../../core/applications/benefactor-applications.service';
import { environment } from '../../../../environments/environment';

const LIST_URL = `${environment.apiUrl}/admin/applications/benefactor`;
const apiApp = {
  id: 'BEN1', userId: 'U1', status: 'pending', submittedAt: '2026-03-12T09:24:00.000Z',
  fullName: 'Ada Obi', email: 'ada@test.com', phone: '0800',
  reasonForSupport: 'I want to help', idConsentGiven: true,
};

describe('BenefactorApprovalsComponent', () => {
  let fixture: ComponentFixture<BenefactorApprovalsComponent>;
  let component: BenefactorApprovalsComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BenefactorApprovalsComponent, HttpClientTestingModule],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BenefactorApprovalsComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(BenefactorApplicationsService);
  });

  afterEach(() => http.verify());

  /** Runs ngOnInit and answers the resulting list request. */
  function init(rows: unknown[] = []) {
    fixture.detectChanges();
    http.expectOne(r => r.url === LIST_URL).flush({ data: rows, traceId: 't' });
    fixture.detectChanges();
  }

  it('creates', () => {
    init();
    expect(component).toBeTruthy();
  });

  it('loads applications from the API on init', () => {
    init([apiApp]);
    expect(component.filtered.length).toBe(1);
    expect(component.filtered[0].status).toBe('pending');
  });

  it('shows nothing when the API returns an empty list', () => {
    init();
    expect(component.filtered.length).toBe(0);
  });

  it('filters by the active tab', () => {
    init([apiApp, { ...apiApp, id: 'X2', status: 'approved' }]);

    component.setTab('pending');
    expect(component.filtered.length).toBe(1);
    expect(component.countFor('approved')).toBe(1);
  });

  it('approve() sends the review request and refetches the list', () => {
    init([apiApp]);

    component.approve('BEN1');

    const req = http.expectOne(`${environment.apiUrl}/admin/applications/benefactor/BEN1/review`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ action: 'approve' });
    req.flush({ data: {}, traceId: 't' });

    http.expectOne(r => r.url === LIST_URL).flush({ data: [], traceId: 't' });
  });

  it('confirmReject() sends the entered reason', () => {
    init([apiApp]);

    component.startReject('BEN1');
    component.rejectReason.set('Invalid ID');
    component.confirmReject('BEN1');

    const req = http.expectOne(`${environment.apiUrl}/admin/applications/benefactor/BEN1/review`);
    expect(req.request.body).toEqual({ action: 'reject', reason: 'Invalid ID' });
    req.flush({ data: {}, traceId: 't' });

    http.expectOne(r => r.url === LIST_URL).flush({ data: [], traceId: 't' });
  });

  // The API returns 422 for a reject with no reason, so don't send one.
  it('confirmReject() does not fire a request when the reason is blank', () => {
    init([apiApp]);

    component.startReject('BEN1');
    component.rejectReason.set('   ');
    component.confirmReject('BEN1');

    expect(http.match(`${environment.apiUrl}/admin/applications/benefactor/BEN1/review`).length).toBe(0);
  });
});
