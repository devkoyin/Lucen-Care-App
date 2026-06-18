import { TestBed } from '@angular/core/testing';
import { BenefactorApplicationsService } from './benefactor-applications.service';
import { ApplicationsService } from './applications.service';

const BASE = {
  fullName: 'Ada Obi', email: 'ada@test.com', phone: '0800',
  reasonForSupport: 'I want to help', docs: [{ label: 'Government-issued ID', submitted: true }],
};

describe('BenefactorApplicationsService', () => {
  let svc: BenefactorApplicationsService;
  let orgApps: ApplicationsService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    svc = TestBed.inject(BenefactorApplicationsService);
    orgApps = TestBed.inject(ApplicationsService);
  });

  it('creates', () => expect(svc).toBeTruthy());

  it('submit sets status to pending', () => {
    svc.submit(BASE);
    expect(svc.applications()[0].status).toBe('pending');
  });

  it('submit logs a benefactor audit entry', () => {
    svc.submit(BASE);
    const entry = orgApps.auditLog().find(e => e.orgType === 'benefactor');
    expect(entry?.action).toBe('submitted');
  });

  it('approve changes status and logs audit', () => {
    svc.submit(BASE);
    const id = svc.applications()[0].id;
    svc.approve(id);
    expect(svc.applications()[0].status).toBe('approved');
    const entry = orgApps.auditLog().find(e => e.action === 'approved');
    expect(entry).toBeTruthy();
  });

  it('reject stores reason and logs audit', () => {
    svc.submit(BASE);
    const id = svc.applications()[0].id;
    svc.reject(id, 'Invalid ID');
    expect(svc.applications()[0].status).toBe('rejected');
    expect(svc.applications()[0].rejectionReason).toBe('Invalid ID');
  });

  it('findByEmail returns the matching application', () => {
    svc.submit(BASE);
    expect(svc.findByEmail('ada@test.com')?.fullName).toBe('Ada Obi');
  });
});
