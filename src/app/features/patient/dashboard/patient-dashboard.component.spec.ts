import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { PatientDashboardComponent } from './patient-dashboard.component';
import { AuthService } from '../../../core/auth/auth.service';
import { User } from '../../../core/auth/auth.models';

describe('PatientDashboardComponent', () => {
  let fixture: ComponentFixture<PatientDashboardComponent>;
  const mockUser: User = { id: '1', role: 'patient', name: 'Alice', email: 'a@b.com', status: 'active' };

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'signup', 'signOut', 'isAuthenticated', 'role'], {
      user: signal(mockUser),
    });

    await TestBed.configureTestingModule({
      imports: [PatientDashboardComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientDashboardComponent);
    fixture.detectChanges();
  });

  it('creates', () => expect(fixture.componentInstance).toBeTruthy());
  it('shows greeting with user name', () => expect(fixture.componentInstance.greeting).toBe('Alice'));
  it('renders 4 quick actions', () => expect(fixture.nativeElement.querySelectorAll('.quick-action').length).toBe(4));
  it('renders 3 appointments', () => expect(fixture.nativeElement.querySelectorAll('.appt-item').length).toBe(3));
  it('renders 3 medications', () => expect(fixture.nativeElement.querySelectorAll('.med-item').length).toBe(3));
  it('statusLabel returns correct text', () => {
    expect(fixture.componentInstance.statusLabel('taken')).toBe('Taken');
    expect(fixture.componentInstance.statusLabel('pending')).toBe('Due');
    expect(fixture.componentInstance.statusLabel('later')).toBe('Later');
  });
});
