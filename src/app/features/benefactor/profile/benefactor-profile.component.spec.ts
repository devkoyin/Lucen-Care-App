import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { BenefactorProfileComponent } from './benefactor-profile.component';
import { AuthService } from '../../../core/auth/auth.service';
import { BenefactorApplicationsService } from '../../../core/applications/benefactor-applications.service';
import { User } from '../../../core/auth/auth.models';

describe('BenefactorProfileComponent', () => {
  let fixture: ComponentFixture<BenefactorProfileComponent>;
  let component: BenefactorProfileComponent;

  function setup(user: User | null) {
    const authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'signup', 'signOut'], {
      user: signal(user),
    });
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [BenefactorProfileComponent],
      providers: [{ provide: AuthService, useValue: authSpy }],
    });
    fixture = TestBed.createComponent(BenefactorProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('creates', () => { setup(null); expect(component).toBeTruthy(); });

  it('returns undefined when no application exists', () => {
    setup({ id: '1', role: 'benefactor', name: 'Ada', email: 'ada@test.com', status: 'active' });
    expect(component.application).toBeUndefined();
  });

  it('returns application matching the current user email', () => {
    const user: User = { id: '1', role: 'benefactor', name: 'Ada', email: 'ada@test.com', status: 'active' };
    setup(user);
    const apps = TestBed.inject(BenefactorApplicationsService);
    apps.submit({ fullName: 'Ada Obi', email: 'ada@test.com', phone: '0800', reasonForSupport: 'Support patients', docs: [] });
    expect(component.application?.fullName).toBe('Ada Obi');
  });
});
