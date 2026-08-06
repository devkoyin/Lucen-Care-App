import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { BenefactorPortalComponent } from './benefactor-portal.component';
import { AuthService } from '../../core/auth/auth.service';
import { MeResponse, User, UserStatus } from '../../core/auth/auth.models';

const USER: User = {
  id: 'U1', role: 'benefactor', name: 'Test User', email: 't@x.com', status: 'active',
};

describe('BenefactorPortalComponent', () => {
  let fixture: ComponentFixture<BenefactorPortalComponent>;
  let component: BenefactorPortalComponent;

  /** `me` null models /auth/me not yet resolved or failing. */
  function setup(status: UserStatus | null) {
    const me: MeResponse | null = status
      ? { id: 'U1', email: 't@x.com', role: 'benefactor', status }
      : null;
    const authStub = {
      user: signal(USER),
      me: () => (me ? of(me) : throwError(() => new Error('unauthenticated'))),
      signOut: jasmine.createSpy('signOut'),
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [BenefactorPortalComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authStub }],
    });
    fixture = TestBed.createComponent(BenefactorPortalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('creates', () => {
    setup('active');
    expect(component).toBeTruthy();
  });

  it('exposes the full nav once the account is verified', () => {
    setup('active');
    expect(component.navItems().map(i => i.label)).toEqual(['Dashboard', 'Community', 'My Profile']);
  });

  // A pending user would otherwise see links that verifiedGuard bounces straight back.
  it('renders no nav links while the account is pending', () => {
    setup('pending');
    expect(component.navItems()).toEqual([]);
  });

  it('renders no nav links for a suspended account', () => {
    setup('suspended');
    expect(component.navItems()).toEqual([]);
  });

  it('renders no nav links before /auth/me resolves', () => {
    setup(null);
    expect(component.navItems()).toEqual([]);
  });

  it('does not claim the account is verified before approval', () => {
    setup('pending');
    expect(component.userRole).toBe('Benefactor');

    setup('active');
    expect(component.userRole).toBe('Verified Benefactor');
  });
});
