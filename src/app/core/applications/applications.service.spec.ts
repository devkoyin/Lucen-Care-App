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
