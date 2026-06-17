import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfessionalApprovalsComponent } from './professional-approvals.component';
import { ProfessionalApplicationsService } from '../../../core/applications/professional-applications.service';

describe('ProfessionalApprovalsComponent', () => {
  let fixture: ComponentFixture<ProfessionalApprovalsComponent>;
  let component: ProfessionalApprovalsComponent;
  let service: ProfessionalApplicationsService;

  const baseApp = {
    fullName: 'Dr. Jane Doe', email: 'jane@doe.com', phone: '0800', profession: 'Doctor' as const,
    licenseNumber: 'LIC-1', specialty: 'Cardiology', yearsOfExperience: 5, bio: 'bio',
    docs: [{ label: 'Medical License / Registration', submitted: true }],
  };

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [ProfessionalApprovalsComponent] }).compileComponents();
    fixture = TestBed.createComponent(ProfessionalApprovalsComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(ProfessionalApplicationsService);
    fixture.detectChanges();
  });

  it('creates', () => expect(component).toBeTruthy());

  it('shows zero applications by default', () => {
    expect(component.filtered.length).toBe(0);
  });

  it('lists a submitted application under the pending tab', () => {
    service.submit(baseApp);
    fixture.detectChanges();
    component.setTab('pending');
    expect(component.filtered.length).toBe(1);
    expect(component.filtered[0].fullName).toBe('Dr. Jane Doe');
  });

  it('approve() moves an application out of pending', () => {
    service.submit(baseApp);
    const id = service.applications()[0].id;
    component.approve(id);
    expect(service.applications()[0].status).toBe('approved');
  });

  it('confirmReject() rejects with the entered reason', () => {
    service.submit(baseApp);
    const id = service.applications()[0].id;
    component.startReject(id);
    component.rejectReason.set('Could not verify licence');
    component.confirmReject(id);
    expect(service.applications()[0].status).toBe('rejected');
    expect(service.applications()[0].rejectionReason).toBe('Could not verify licence');
  });
});
