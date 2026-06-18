import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { BenefactorPendingComponent } from './benefactor-pending.component';
import { AuthService } from '../../../core/auth/auth.service';
import { BenefactorApplicationsService } from '../../../core/applications/benefactor-applications.service';
import { User } from '../../../core/auth/auth.models';

describe('BenefactorPendingComponent', () => {
  let fixture: ComponentFixture<BenefactorPendingComponent>;
  let component: BenefactorPendingComponent;

  function setup(user: User | null) {
    const authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'signup', 'signOut'], {
      user: signal(user),
    });
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [BenefactorPendingComponent],
      providers: [{ provide: AuthService, useValue: authSpy }],
    });
    fixture = TestBed.createComponent(BenefactorPendingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('creates', () => { setup(null); expect(component).toBeTruthy(); });

  it('shows pending message when application is pending', () => {
    const user: User = { id: '1', role: 'benefactor', name: 'Ada', email: 'ada@test.com', status: 'pending' };
    setup(user);
    const apps = TestBed.inject(BenefactorApplicationsService);
    apps.submit({ fullName: 'Ada', email: 'ada@test.com', phone: '0800', reasonForSupport: 'I want to help', docs: [] });
    expect(component.title).toBe('Verification in progress');
  });

  it('shows rejection reason when application is rejected', () => {
    const user: User = { id: '1', role: 'benefactor', name: 'Ada', email: 'ada@test.com', status: 'pending' };
    setup(user);
    const apps = TestBed.inject(BenefactorApplicationsService);
    apps.submit({ fullName: 'Ada', email: 'ada@test.com', phone: '0800', reasonForSupport: 'I want to help', docs: [] });
    apps.reject(apps.applications()[0].id, 'ID not legible');
    expect(component.title).toBe('Application rejected');
    expect(component.description).toBe('ID not legible');
  });
});
