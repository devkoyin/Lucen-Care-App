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

  it('returns mock application when no real application exists', () => {
    setup({ id: '1', role: 'benefactor', name: 'Ada', email: 'ada@test.com', status: 'active' });
    expect(component.application).toBeDefined();
    expect(component.application.fullName).toBe('Adunola Fashola');
  });

  it('returns real application matching the current user email when one exists', () => {
    const user: User = { id: '1', role: 'benefactor', name: 'Ada', email: 'ada@test.com', status: 'active' };
    setup(user);
    const apps = TestBed.inject(BenefactorApplicationsService);
    apps.submit({ fullName: 'Ada Obi', email: 'ada@test.com', phone: '0800', reasonForSupport: 'Support patients', docs: [] });
    expect(component.application.fullName).toBe('Ada Obi');
  });
});
