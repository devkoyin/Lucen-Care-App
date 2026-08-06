import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ProfessionalApprovalsComponent } from './professional-approvals.component';
import { ProfessionalApplicationsService } from '../../../core/applications/professional-applications.service';
import { environment } from '../../../../environments/environment';

const LIST_URL = `${environment.apiUrl}/admin/applications/professional`;
const apiApp = {
  id: 'APP1', userId: 'U1', status: 'pending', submittedAt: '2026-03-12T09:24:00.000Z',
  name: 'Dr. Jane Doe', email: 'jane@doe.com', phone: '0800', profession: 'Doctor',
  licenseNumber: 'LIC-1', specialty: 'Cardiology', yearsOfExperience: 5, bio: 'bio',
};

describe('ProfessionalApprovalsComponent', () => {
  let fixture: ComponentFixture<ProfessionalApprovalsComponent>;
  let component: ProfessionalApprovalsComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfessionalApprovalsComponent, HttpClientTestingModule],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfessionalApprovalsComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(ProfessionalApplicationsService);
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

    component.approve('APP1');

    const req = http.expectOne(`${environment.apiUrl}/admin/applications/professional/APP1/review`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ action: 'approve' });
    req.flush({ data: {}, traceId: 't' });

    http.expectOne(r => r.url === LIST_URL).flush({ data: [], traceId: 't' });
  });

  it('confirmReject() sends the entered reason', () => {
    init([apiApp]);

    component.startReject('APP1');
    component.rejectReason.set('Could not verify licence');
    component.confirmReject('APP1');

    const req = http.expectOne(`${environment.apiUrl}/admin/applications/professional/APP1/review`);
    expect(req.request.body).toEqual({ action: 'reject', reason: 'Could not verify licence' });
    req.flush({ data: {}, traceId: 't' });

    http.expectOne(r => r.url === LIST_URL).flush({ data: [], traceId: 't' });
  });

  // The API returns 422 for a reject with no reason, so don't send one.
  it('confirmReject() does not fire a request when the reason is blank', () => {
    init([apiApp]);

    component.startReject('APP1');
    component.rejectReason.set('   ');
    component.confirmReject('APP1');

    expect(http.match(`${environment.apiUrl}/admin/applications/professional/APP1/review`).length).toBe(0);
  });
});
