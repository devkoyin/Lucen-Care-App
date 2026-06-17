import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CommunityComponent } from './community.component';
import { AuthService } from '../../../core/auth/auth.service';
import { ProfessionalApplicationsService } from '../../../core/applications/professional-applications.service';
import { User } from '../../../core/auth/auth.models';

describe('CommunityComponent', () => {
  let fixture: ComponentFixture<CommunityComponent>;
  let component: CommunityComponent;

  function setup(user: User | null): void {
    const authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'signup', 'signOut', 'isAuthenticated', 'role'], {
      user: signal(user),
    });
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [CommunityComponent],
      providers: [{ provide: AuthService, useValue: authSpy }],
    });
    fixture = TestBed.createComponent(CommunityComponent);
    component = fixture.componentInstance;
  }

  it('creates', () => {
    setup(null);
    expect(component).toBeTruthy();
  });

  it('tags a new post from an approved professional with the verified badge', () => {
    const profUser: User = { id: '1', role: 'professional', name: 'Dr. Jane Doe', email: 'jane@doe.com', status: 'active' };
    setup(profUser);
    const profApps = TestBed.inject(ProfessionalApplicationsService);
    profApps.submit({
      fullName: 'Dr. Jane Doe', email: 'jane@doe.com', phone: '0800', profession: 'Doctor',
      licenseNumber: 'LIC-1', specialty: 'Cardiology', yearsOfExperience: 5, bio: 'bio', docs: [],
    });
    profApps.approve(profApps.applications()[0].id);

    component.addPost({ groupId: 'diabetes', groupLabel: 'Diabetes Support', groupColor: '#D97706', title: 'Title', content: 'Content', tags: [] });

    const post = component.posts()[0];
    expect(post.authorBadge).toBe('verified-professional');
    expect(post.authorSpecialty).toBe('Cardiology');
    expect(post.author).toBe('Dr. Jane Doe');
  });

  it('does not tag a post from a patient', () => {
    const patientUser: User = { id: '2', role: 'patient', name: 'Amaka', email: 'amaka@test.com', status: 'active' };
    setup(patientUser);
    component.addPost({ groupId: 'diabetes', groupLabel: 'Diabetes Support', groupColor: '#D97706', title: 'Title', content: 'Content', tags: [] });
    const post = component.posts()[0];
    expect(post.authorBadge).toBeUndefined();
  });

  it('does not tag a post from a professional whose application is still pending', () => {
    const profUser: User = { id: '1', role: 'professional', name: 'Dr. Jane Doe', email: 'jane@doe.com', status: 'pending' };
    setup(profUser);
    const profApps = TestBed.inject(ProfessionalApplicationsService);
    profApps.submit({
      fullName: 'Dr. Jane Doe', email: 'jane@doe.com', phone: '0800', profession: 'Doctor',
      licenseNumber: 'LIC-1', specialty: 'Cardiology', yearsOfExperience: 5, bio: 'bio', docs: [],
    });

    component.addPost({ groupId: 'diabetes', groupLabel: 'Diabetes Support', groupColor: '#D97706', title: 'Title', content: 'Content', tags: [] });
    const post = component.posts()[0];
    expect(post.authorBadge).toBeUndefined();
  });
});
