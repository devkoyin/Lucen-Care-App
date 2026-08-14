import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { NgoPortalComponent } from './ngo-portal.component';
import { AuthService } from '../../core/auth/auth.service';
import { MeResponse, User, UserStatus } from '../../core/auth/auth.models';

const USER: User = {
  id: 'U1', role: 'ngo', name: 'Hope Health', email: 't@x.com', status: 'active',
};

describe('NgoPortalComponent', () => {
  let fixture: ComponentFixture<NgoPortalComponent>;
  let component: NgoPortalComponent;

  /** `me` null models /auth/me not yet resolved or failing. */
  function setup(status: UserStatus | null) {
    const me: MeResponse | null = status
      ? { id: 'U1', email: 't@x.com', role: 'ngo', status, orgId: 'ORG1' }
      : null;
    const authStub = {
      user: signal(USER),
      me: () => (me ? of(me) : throwError(() => new Error('unauthenticated'))),
      signOut: jasmine.createSpy('signOut'),
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [NgoPortalComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authStub }],
    });
    fixture = TestBed.createComponent(NgoPortalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('creates', () => {
    setup('active');
    expect(component).toBeTruthy();
  });

  it('links to settings once the organisation is verified', () => {
    setup('active');
    expect(component.settingsRoute()).toBe('/ngo/settings');
  });

  // The settings route is verifiedGuard-ed, so offering the link while pending
  // would bounce the user straight back to /ngo/pending.
  it('hides the settings link until the organisation is verified', () => {
    setup('pending');
    expect(component.settingsRoute()).toBe('');

    setup('suspended');
    expect(component.settingsRoute()).toBe('');

    setup(null);
    expect(component.settingsRoute()).toBe('');
  });
});
