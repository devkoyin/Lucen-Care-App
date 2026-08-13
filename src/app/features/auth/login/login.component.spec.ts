import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
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
      imports: [HttpClientTestingModule, LoginComponent],
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

  it('names the role on the submit button', () => {
    expect(fixture.componentInstance.roleName).toBe('Patient & Caregiver');
    expect(fixture.nativeElement.textContent).toContain('Sign in as Patient & Caregiver');
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

  it('does not offer admin in the role switcher', () => {
    expect(fixture.componentInstance.roles.some(r => r.id === 'admin')).toBeFalse();
  });

  it('falls back to patient when the URL asks for the admin portal', () => {
    // /auth/admin/login must not become a second admin door — the portal has its
    // own login at /admin/login.
    const f = TestBed.createComponent(LoginComponent);
    f.componentInstance.role = 'admin';
    f.detectChanges();

    expect(f.componentInstance.selectedRole()).toBe('patient');
    expect(f.nativeElement.textContent).not.toContain('Sign in as Admin');
  });

  it('navigates professionals to the community page instead of dashboard', () => {
    const router = TestBed.inject(Router);
    const navSpy = spyOn(router, 'navigate');
    fixture.componentInstance.role = 'professional';
    fixture.componentInstance.selectRole('professional');
    fixture.componentInstance.form.setValue({ email: 'jane@doe.com', password: 'password123' });
    authSpy.login.and.returnValue(of({ id: '2', role: 'professional', name: 'Dr. Jane', email: 'jane@doe.com', status: 'pending' }));
    fixture.componentInstance.submit();
    expect(navSpy).toHaveBeenCalledWith(['/', 'professional', 'community']);
  });
});
