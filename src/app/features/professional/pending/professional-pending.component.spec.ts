import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ProfessionalPendingComponent } from './professional-pending.component';
import { AuthService } from '../../../core/auth/auth.service';
import { ProfessionalApplicationsService } from '../../../core/applications/professional-applications.service';
import { User } from '../../../core/auth/auth.models';

describe('ProfessionalPendingComponent', () => {
  let fixture: ComponentFixture<ProfessionalPendingComponent>;

  function setup(user: User | null): ProfessionalApplicationsService {
    const authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'signup', 'signOut', 'isAuthenticated', 'role'], {
      user: signal(user),
    });
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [ProfessionalPendingComponent],
      providers: [{ provide: AuthService, useValue: authSpy }],
    });
    fixture = TestBed.createComponent(ProfessionalPendingComponent);
    return TestBed.inject(ProfessionalApplicationsService);
  }

  it('creates', () => {
    setup(null);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows a pending message while the application is under review', () => {
    const apps = setup({ id: '1', role: 'professional', name: 'Dr. Jane', email: 'jane@doe.com', status: 'pending' });
    apps.submit({
      fullName: 'Dr. Jane', email: 'jane@doe.com', phone: '0800', profession: 'Doctor',
      licenseNumber: 'LIC-1', specialty: 'Cardiology', yearsOfExperience: 5, bio: 'bio', docs: [],
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.title).toBe('Verification in progress');
  });

  it('shows the rejection reason when the application was rejected', () => {
    const apps = setup({ id: '1', role: 'professional', name: 'Dr. Jane', email: 'jane@doe.com', status: 'pending' });
    apps.submit({
      fullName: 'Dr. Jane', email: 'jane@doe.com', phone: '0800', profession: 'Doctor',
      licenseNumber: 'LIC-1', specialty: 'Cardiology', yearsOfExperience: 5, bio: 'bio', docs: [],
    });
    apps.reject(apps.applications()[0].id, 'Licence could not be verified');
    fixture.detectChanges();
    expect(fixture.componentInstance.title).toBe('Application rejected');
    expect(fixture.componentInstance.description).toBe('Licence could not be verified');
  });
});
