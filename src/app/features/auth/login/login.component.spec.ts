import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/auth/auth.service';
import { User } from '../../../core/auth/auth.models';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;

  const mockUser: User = { id: '1', role: 'patient', name: 'Alice', email: 'a@b.com', status: 'active' };

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'signup', 'signOut', 'isAuthenticated', 'role']);
    authSpy.login.and.returnValue(of(mockUser));

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    fixture.componentInstance.role = 'patient';
    fixture.detectChanges();
  });

  it('creates', () => expect(fixture.componentInstance).toBeTruthy());

  it('shows the role badge', () => {
    const badge = fixture.nativeElement.querySelector('.auth-card__role-badge');
    expect(badge.textContent.trim()).toBe('Patient & Caregiver');
  });

  it('shows email error when touched and empty', () => {
    fixture.componentInstance.form.get('email')!.markAsTouched();
    fixture.detectChanges();
    expect(fixture.componentInstance.emailError).toBe('Email is required');
  });

  it('calls auth.login on valid submit', () => {
    fixture.componentInstance.form.setValue({ email: 'test@test.com', password: 'password123' });
    fixture.componentInstance.submit();
    expect(authSpy.login).toHaveBeenCalledWith('patient', { email: 'test@test.com', password: 'password123' });
  });

  it('does not call auth.login when form is invalid', () => {
    fixture.componentInstance.submit();
    expect(authSpy.login).not.toHaveBeenCalled();
  });
});
