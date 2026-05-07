import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { HmoDashboardComponent } from './hmo-dashboard.component';
import { AuthService } from '../../../core/auth/auth.service';
import { User } from '../../../core/auth/auth.models';

describe('HmoDashboardComponent', () => {
  let fixture: ComponentFixture<HmoDashboardComponent>;
  const mockUser: User = { id: '1', role: 'hmo', name: 'HealthCo HMO', email: 'a@hmo.com', status: 'active' };

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'signup', 'signOut', 'isAuthenticated', 'role'], {
      user: signal(mockUser),
    });
    await TestBed.configureTestingModule({
      imports: [HmoDashboardComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authSpy }],
    }).compileComponents();
    fixture = TestBed.createComponent(HmoDashboardComponent);
    fixture.detectChanges();
  });

  it('creates', () => expect(fixture.componentInstance).toBeTruthy());
  it('shows org name', () => expect(fixture.componentInstance.orgName).toBe('HealthCo HMO'));
  it('renders 4 stat cards', () => expect(fixture.nativeElement.querySelectorAll('.stat-card').length).toBe(4));
  it('renders activity items', () => expect(fixture.nativeElement.querySelectorAll('.activity-item').length).toBe(5));
  it('completenessColor returns green for >=80', () => expect(fixture.componentInstance.completenessColor(85)).toBe('#34D399'));
  it('completenessColor returns amber for 50-79', () => expect(fixture.componentInstance.completenessColor(65)).toBe('#F59E0B'));
  it('completenessColor returns red for <50', () => expect(fixture.componentInstance.completenessColor(40)).toBe('#EF4444'));
});
