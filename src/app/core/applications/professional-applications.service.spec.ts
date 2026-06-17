import { TestBed } from '@angular/core/testing';
import { ProfessionalApplicationsService } from './professional-applications.service';
import { ApplicationsService } from './applications.service';

describe('ProfessionalApplicationsService', () => {
  let service: ProfessionalApplicationsService;
  let appsService: ApplicationsService;

  const baseApp = {
    fullName: 'Dr. Jane Doe',
    email: 'jane@doe.com',
    phone: '08000000000',
    profession: 'Doctor' as const,
    licenseNumber: 'LIC-123',
    specialty: 'Cardiology',
    yearsOfExperience: 8,
    bio: 'Cardiologist with 8 years of clinical practice.',
    docs: [{ label: 'Medical License / Registration', submitted: true }],
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [ProfessionalApplicationsService, ApplicationsService] });
    service = TestBed.inject(ProfessionalApplicationsService);
    appsService = TestBed.inject(ApplicationsService);
  });

  it('creates', () => expect(service).toBeTruthy());

  it('submits a new application with pending status', () => {
    service.submit(baseApp);
    const apps = service.applications();
    expect(apps.length).toBe(1);
    expect(apps[0].status).toBe('pending');
    expect(apps[0].fullName).toBe('Dr. Jane Doe');
  });

  it('logs a submission audit entry through ApplicationsService', () => {
    service.submit(baseApp);
    const entry = appsService.auditLog()[0];
    expect(entry.action).toBe('submitted');
    expect(entry.orgType).toBe('professional');
    expect(entry.orgName).toBe('Dr. Jane Doe');
  });

  it('approves an application and logs an audit entry', () => {
    service.submit(baseApp);
    const id = service.applications()[0].id;
    service.approve(id, 'Admin Taiwo');
    expect(service.applications()[0].status).toBe('approved');
    const entry = appsService.auditLog()[0];
    expect(entry.action).toBe('approved');
    expect(entry.actor).toBe('Admin Taiwo');
  });

  it('rejects an application with a reason', () => {
    service.submit(baseApp);
    const id = service.applications()[0].id;
    service.reject(id, 'Licence could not be verified', 'Admin Taiwo');
    expect(service.applications()[0].status).toBe('rejected');
    expect(service.applications()[0].rejectionReason).toBe('Licence could not be verified');
  });

  it('finds an application by email', () => {
    service.submit(baseApp);
    expect(service.findByEmail('jane@doe.com')?.fullName).toBe('Dr. Jane Doe');
    expect(service.findByEmail('nope@doe.com')).toBeUndefined();
  });

  it('updates the bio for an application', () => {
    service.submit(baseApp);
    const id = service.applications()[0].id;
    service.updateBio(id, 'Updated bio text');
    expect(service.applications()[0].bio).toBe('Updated bio text');
  });
});
