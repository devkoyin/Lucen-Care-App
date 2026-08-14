import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ProfessionalPortalComponent } from './professional-portal.component';
import { AuthService } from '../../core/auth/auth.service';
import { MeResponse, User, UserStatus } from '../../core/auth/auth.models';

const USER: User = {
  id: 'U1', role: 'professional', name: 'Test User', email: 't@x.com', status: 'active',
};

describe('ProfessionalPortalComponent', () => {
  let fixture: ComponentFixture<ProfessionalPortalComponent>;
  let component: ProfessionalPortalComponent;

  /** `me` null models /auth/me not yet resolved or failing. */
  function setup(status: UserStatus | null) {
    const me: MeResponse | null = status
      ? { id: 'U1', email: 't@x.com', role: 'professional', status }
      : null;
    const authStub = {
      user: signal(USER),
      me: () => (me ? of(me) : throwError(() => new Error('unauthenticated'))),
      signOut: jasmine.createSpy('signOut'),
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ProfessionalPortalComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authStub }],
    });
    fixture = TestBed.createComponent(ProfessionalPortalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('creates', () => {
    setup('active');
    expect(component).toBeTruthy();
  });

  it('exposes the full nav once the account is verified', () => {
    setup('active');
    expect(component.navItems().map(i => i.label)).toEqual(['Dashboard', 'Community']);
  });

  it('links to settings once the account is verified', () => {
    setup('active');
    expect(component.settingsRoute()).toBe('/professional/settings');
  });

  // The settings route is verifiedGuard-ed, so offering the link while pending
  // would bounce the user straight back to /professional/pending.
  it('hides the settings link until the account is verified', () => {
    setup('pending');
    expect(component.settingsRoute()).toBe('');

    setup(null);
    expect(component.settingsRoute()).toBe('');
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
});
