import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { NgoDashboardComponent } from './ngo-dashboard.component';
import { AuthService } from '../../../core/auth/auth.service';
import { User } from '../../../core/auth/auth.models';

describe('NgoDashboardComponent', () => {
  let fixture: ComponentFixture<NgoDashboardComponent>;
  const mockUser: User = { id: '1', role: 'ngo', name: 'Help Org', email: 'a@ngo.org', status: 'active' };

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'signup', 'signOut', 'isAuthenticated', 'role'], {
      user: signal(mockUser),
    });
    await TestBed.configureTestingModule({
      imports: [NgoDashboardComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authSpy }],
    }).compileComponents();
    fixture = TestBed.createComponent(NgoDashboardComponent);
    fixture.detectChanges();
  });

  it('creates', () => expect(fixture.componentInstance).toBeTruthy());
  it('shows org name', () => expect(fixture.componentInstance.orgName).toBe('Help Org'));
  it('renders 4 stat cards', () => expect(fixture.nativeElement.querySelectorAll('.stat-card').length).toBe(4));
  it('renders applicant rows', () => expect(fixture.nativeElement.querySelectorAll('.applicant-table tbody tr').length).toBe(5));
  it('renders program items', () => expect(fixture.nativeElement.querySelectorAll('.program-item').length).toBe(4));
  it('fillPercent calculates correctly', () => {
    expect(fixture.componentInstance.fillPercent({ name: 'x', filled: 25, total: 50, status: 'active' })).toBe(50);
  });
});
