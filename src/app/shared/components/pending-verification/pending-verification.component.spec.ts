import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PendingVerificationComponent } from './pending-verification.component';
import { AuthService } from '../../../core/auth/auth.service';
import { MeResponse } from '../../../core/auth/auth.models';

const WAITING = 'Our team is reviewing your application.';

describe('PendingVerificationComponent', () => {
  let fixture: ComponentFixture<PendingVerificationComponent>;
  let component: PendingVerificationComponent;

  function setup(me: MeResponse | null) {
    const authStub = {
      me: () => (me ? of(me) : throwError(() => new Error('unauthenticated'))),
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [PendingVerificationComponent],
      providers: [{ provide: AuthService, useValue: authStub }],
    });
    fixture = TestBed.createComponent(PendingVerificationComponent);
    component = fixture.componentInstance;
    component.waitingMessage = WAITING;
    fixture.detectChanges();
  }

  const base: MeResponse = { id: 'U1', email: 't@x.com', role: 'ngo', status: 'pending' };

  it('creates', () => {
    setup(base);
    expect(component).toBeTruthy();
  });

  it('shows the route-supplied waiting message while under review', () => {
    setup(base);
    expect(component.title).toBe('Verification in progress');
    expect(component.description).toBe(WAITING);
    expect(component.icon).toBe('⏳');
  });

  it('falls back to the waiting message when /auth/me is unavailable', () => {
    setup(null);
    expect(component.title).toBe('Verification in progress');
    expect(component.description).toBe(WAITING);
  });

  // NGO/HMO have their review recorded on the organisation...
  it('reads a rejection from the organisation for NGO and HMO', () => {
    setup({
      ...base,
      organization: {
        id: 'ORG1', name: 'Hope Health', type: 'ngo',
        status: 'rejected', rejectionReason: 'Registration number could not be verified',
      },
    });

    expect(component.title).toBe('Application rejected');
    expect(component.rejectionReason).toBe('Registration number could not be verified');
    expect(component.icon).toBe('✕');
  });

  // ...and professional/benefactor on their own application row.
  it('reads a rejection from the application for professional and benefactor', () => {
    setup({
      ...base,
      role: 'professional',
      application: {
        id: 'A1', status: 'rejected', submittedAt: '2026-01-01',
        rejectionReason: 'Licence could not be verified',
      },
    });

    expect(component.title).toBe('Application rejected');
    expect(component.rejectionReason).toBe('Licence could not be verified');
  });

  describe('rejected state', () => {
    function rejectWith(rejectionReason?: string) {
      setup({
        ...base,
        application: { id: 'A1', status: 'rejected', submittedAt: '2026-01-01', rejectionReason },
      });
    }

    // The regression: the reason used to be dumped into the description with no
    // label, so a user saw a bare sentence and no clue what it referred to.
    it('renders the reason inside a labelled note', () => {
      rejectWith('Registration number could not be verified');

      const note = fixture.nativeElement.querySelector('lc-reason-note');
      expect(note).not.toBeNull();
      const text = note.textContent as string;
      expect(text).toContain('Rejection reason:');
      expect(text).toContain('Registration number could not be verified');
    });

    it('states the outcome separately from the reason', () => {
      rejectWith('Registration number could not be verified');

      expect(component.description).toBe('Your application was not approved.');
      // The reason must not leak back into the outcome line.
      expect(component.description).not.toContain('Registration number');
    });

    // Previously the next step only appeared when there was NO reason, so the users
    // with the most to act on were the only ones told nothing.
    it('shows the next step even when a reason is present', () => {
      rejectWith('Registration number could not be verified');

      expect(fixture.nativeElement.textContent).toContain('contact support');
    });

    it('omits the note but keeps outcome and next step when no reason was given', () => {
      rejectWith(undefined);

      expect(fixture.nativeElement.querySelector('lc-reason-note')).toBeNull();
      const text = fixture.nativeElement.textContent as string;
      expect(text).toContain('was not approved');
      expect(text).toContain('contact support');
    });
  });

  it('shows neither the note nor the next step while still under review', () => {
    setup(base);

    expect(fixture.nativeElement.querySelector('lc-reason-note')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('contact support');
  });

  it('renders the title and description into the template', () => {
    setup(base);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Verification in progress');
    expect(text).toContain(WAITING);
  });
});
