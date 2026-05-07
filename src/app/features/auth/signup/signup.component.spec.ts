import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { SignupComponent } from './signup.component';
import { AuthService } from '../../../core/auth/auth.service';
import { User } from '../../../core/auth/auth.models';

describe('SignupComponent', () => {
  let fixture: ComponentFixture<SignupComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;

  const mockUser: User = { id: '1', role: 'patient', name: 'Alice', email: 'a@b.com', status: 'active' };

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'signup', 'signOut', 'isAuthenticated', 'role']);
    authSpy.signup.and.returnValue(of(mockUser));

    await TestBed.configureTestingModule({
      imports: [SignupComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SignupComponent);
    fixture.componentInstance.role = 'patient';
    fixture.detectChanges();
  });

  it('creates', () => expect(fixture.componentInstance).toBeTruthy());

  it('shows the role badge', () => {
    const badge = fixture.nativeElement.querySelector('.auth-card__role-badge');
    expect(badge.textContent.trim()).toBe('Patient & Caregiver');
  });

  it('shows name error when touched and empty', () => {
    fixture.componentInstance.form.get('name')!.markAsTouched();
    fixture.detectChanges();
    expect(fixture.componentInstance.fieldError('name')).toContain('required');
  });

  it('shows password mismatch error', () => {
    fixture.componentInstance.form.patchValue({ password: 'password123', confirmPassword: 'different1' });
    fixture.componentInstance.form.get('confirmPassword')!.markAsTouched();
    fixture.detectChanges();
    expect(fixture.componentInstance.confirmPasswordError).toContain('match');
  });

  it('calls auth.signup on valid submit', () => {
    fixture.componentInstance.form.setValue({ name: 'Alice', email: 'a@b.com', password: 'password123', confirmPassword: 'password123' });
    fixture.componentInstance.submit();
    expect(authSpy.signup).toHaveBeenCalledWith('patient', { name: 'Alice', email: 'a@b.com', password: 'password123' });
  });

  it('does not submit when form is invalid', () => {
    fixture.componentInstance.submit();
    expect(authSpy.signup).not.toHaveBeenCalled();
  });
});
