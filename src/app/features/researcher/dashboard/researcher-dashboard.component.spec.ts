import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { ResearcherDashboardComponent } from './researcher-dashboard.component';
import { AuthService } from '../../../core/auth/auth.service';
import { User } from '../../../core/auth/auth.models';

describe('ResearcherDashboardComponent', () => {
  let fixture: ComponentFixture<ResearcherDashboardComponent>;
  const mockUser: User = { id: '1', role: 'researcher', name: 'Dr. Adaeze', email: 'a@uni.edu', status: 'active' };

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'signup', 'signOut', 'isAuthenticated', 'role'], {
      user: signal(mockUser),
    });
    await TestBed.configureTestingModule({
      imports: [ResearcherDashboardComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authSpy }],
    }).compileComponents();
    fixture = TestBed.createComponent(ResearcherDashboardComponent);
    fixture.detectChanges();
  });

  it('creates', () => expect(fixture.componentInstance).toBeTruthy());
  it('shows researcher name', () => expect(fixture.componentInstance.researcherName).toBe('Dr. Adaeze'));
  it('renders 4 stat cards', () => expect(fixture.nativeElement.querySelectorAll('.stat-card').length).toBe(4));
  it('renders study items', () => expect(fixture.nativeElement.querySelectorAll('.study-item').length).toBe(4));
  it('renders interest items', () => expect(fixture.nativeElement.querySelectorAll('.interest-item').length).toBe(5));
  it('enrollPercent calculates correctly', () => {
    expect(fixture.componentInstance.enrollPercent({ title: 'x', condition: 'y', enrolled: 10, target: 20, status: 'recruiting' })).toBe(50);
  });
  it('statusLabel returns correct strings', () => {
    expect(fixture.componentInstance.statusLabel('recruiting')).toBe('Recruiting');
    expect(fixture.componentInstance.statusLabel('active')).toBe('Active');
  });
});
