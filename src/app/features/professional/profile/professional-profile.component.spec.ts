import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ProfessionalProfileComponent } from './professional-profile.component';
import { AuthService } from '../../../core/auth/auth.service';
import { ProfessionalApplicationsService } from '../../../core/applications/professional-applications.service';
import { User } from '../../../core/auth/auth.models';

describe('ProfessionalProfileComponent', () => {
  let fixture: ComponentFixture<ProfessionalProfileComponent>;
  let component: ProfessionalProfileComponent;
  let apps: ProfessionalApplicationsService;

  const mockUser: User = { id: '1', role: 'professional', name: 'Dr. Jane Doe', email: 'jane@doe.com', status: 'active' };

  beforeEach(() => {
    localStorage.clear();
    const authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'signup', 'signOut', 'isAuthenticated', 'role'], {
      user: signal(mockUser),
    });
    TestBed.configureTestingModule({
      imports: [ProfessionalProfileComponent],
      providers: [{ provide: AuthService, useValue: authSpy }],
    });
    fixture = TestBed.createComponent(ProfessionalProfileComponent);
    component = fixture.componentInstance;
    apps = TestBed.inject(ProfessionalApplicationsService);
    apps.submit({
      fullName: 'Dr. Jane Doe', email: 'jane@doe.com', phone: '0800', profession: 'Doctor',
      licenseNumber: 'LIC-1', specialty: 'Cardiology', yearsOfExperience: 5, bio: 'Original bio', docs: [],
    });
    apps.approve(apps.applications()[0].id);
    fixture.detectChanges();
  });

  it('creates', () => expect(component).toBeTruthy());

  it('shows the current application for the signed-in professional', () => {
    expect(component.application?.specialty).toBe('Cardiology');
  });

  it('saves an edited bio', () => {
    component.startEditBio();
    component.bioDraft.set('Updated bio');
    component.saveBio();
    expect(component.application?.bio).toBe('Updated bio');
    expect(component.editingBio()).toBeFalse();
  });

  it('cancelEditBio() discards the draft', () => {
    component.startEditBio();
    component.bioDraft.set('Discarded draft');
    component.cancelEditBio();
    expect(component.application?.bio).toBe('Original bio');
    expect(component.editingBio()).toBeFalse();
  });
});
