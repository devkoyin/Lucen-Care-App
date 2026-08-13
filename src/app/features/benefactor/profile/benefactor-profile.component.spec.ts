import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { BenefactorProfileComponent } from './benefactor-profile.component';
import { AuthService } from '../../../core/auth/auth.service';
import { MeResponse } from '../../../core/auth/auth.models';

const BASE_ME: MeResponse = {
  id: 'U1',
  email: 'ada@test.com',
  role: 'benefactor',
  status: 'active',
  name: 'Ada Obi',
};

describe('BenefactorProfileComponent', () => {
  let fixture: ComponentFixture<BenefactorProfileComponent>;
  let component: BenefactorProfileComponent;

  function setup(me: MeResponse | null) {
    const authStub = {
      me: () => (me ? of(me) : throwError(() => new Error('unauthenticated'))),
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, BenefactorProfileComponent],
      providers: [{ provide: AuthService, useValue: authStub }],
    });
    fixture = TestBed.createComponent(BenefactorProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('creates', () => {
    setup(null);
    expect(component).toBeTruthy();
  });

  // Previously this fell back to a hardcoded "Adunola Fashola" fixture, which
  // every benefactor saw. There is no fallback now — null renders a placeholder.
  it('renders no application when /auth/me is unavailable', () => {
    setup(null);
    expect(component.application()).toBeNull();
  });

  it('renders no application when the user has not applied yet', () => {
    setup(BASE_ME);
    expect(component.application()).toBeNull();
  });

  it('renders the signed-in user’s real application', () => {
    setup({
      ...BASE_ME,
      application: {
        id: 'BEN1',
        status: 'approved',
        submittedAt: '2026-03-12T09:24:00.000Z',
        fullName: 'Ada Obi',
        phone: '0800',
        reasonForSupport: 'Support patients',
        idConsentGiven: true,
        reviewedAt: '2026-03-15T14:00:00.000Z',
      },
    });

    const app = component.application()!;
    expect(app.fullName).toBe('Ada Obi');
    expect(app.email).toBe('ada@test.com');
    expect(app.status).toBe('approved');
    expect(app.docs[0].submitted).toBeTrue();
  });

  it('marks the identity document as outstanding when consent was not given', () => {
    setup({
      ...BASE_ME,
      application: {
        id: 'BEN1',
        status: 'pending',
        submittedAt: '2026-03-12T09:24:00.000Z',
        fullName: 'Ada Obi',
        phone: '0800',
        reasonForSupport: 'Support patients',
        idConsentGiven: false,
      },
    });

    expect(component.application()!.docs[0].submitted).toBeFalse();
  });
});
