import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BenefactorApprovalsComponent } from './benefactor-approvals.component';
import { BenefactorApplicationsService } from '../../../core/applications/benefactor-applications.service';

const BASE = {
  fullName: 'Ada Obi', email: 'ada@test.com', phone: '0800',
  reasonForSupport: 'I want to help', docs: [{ label: 'Government-issued ID', submitted: true }],
};

describe('BenefactorApprovalsComponent', () => {
  let fixture: ComponentFixture<BenefactorApprovalsComponent>;
  let component: BenefactorApprovalsComponent;
  let svc: BenefactorApplicationsService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [BenefactorApprovalsComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(BenefactorApprovalsComponent);
    component = fixture.componentInstance;
    svc = TestBed.inject(BenefactorApplicationsService);
    fixture.detectChanges();
  });

  it('creates', () => expect(component).toBeTruthy());

  it('shows zero applications by default', () => expect(component.filtered.length).toBe(0));

  it('lists pending applications', () => {
    svc.submit(BASE);
    expect(component.filtered.length).toBe(1);
    expect(component.filtered[0].status).toBe('pending');
  });

  it('approve changes status to approved', () => {
    svc.submit(BASE);
    const id = svc.applications()[0].id;
    component.approve(id);
    expect(svc.applications()[0].status).toBe('approved');
  });

  it('confirmReject rejects with reason', () => {
    svc.submit(BASE);
    const id = svc.applications()[0].id;
    component.startReject(id);
    component.rejectReason.set('Invalid ID');
    component.confirmReject(id);
    expect(svc.applications()[0].status).toBe('rejected');
    expect(svc.applications()[0].rejectionReason).toBe('Invalid ID');
  });
});
