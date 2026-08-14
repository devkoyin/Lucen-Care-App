import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { NgoProfileComponent } from './ngo-profile.component';
import { AuthService } from '../../../core/auth/auth.service';
import { MeOrganization, MeResponse } from '../../../core/auth/auth.models';

const ORG: MeOrganization = {
  id: 'ORG1',
  name: 'Hope Health Initiative',
  type: 'ngo',
  status: 'active',
  registrationNumber: 'RC-1234567',
  tin: '01234567-0001',
  scumlNumber: 'SC-998877',
  contactEmail: 'admin@hopehealth.org',
  website: 'https://hopehealth.org',
  focusAreas: 'Maternal health, HIV/AIDS',
  operatingRegions: 'Lagos, Ogun, Oyo',
  headOfficeCountry: 'NG',
  programDescription: 'Free antenatal care across three states.',
};

describe('NgoProfileComponent', () => {
  let fixture: ComponentFixture<NgoProfileComponent>;
  let component: NgoProfileComponent;

  /** `organization` undefined models /auth/me not yet resolved or failing. */
  function setup(organization?: MeOrganization) {
    const me: MeResponse | null = organization
      ? { id: 'U1', email: 't@x.com', role: 'ngo', status: 'active', orgId: organization.id, organization }
      : null;
    const authStub = {
      me: () => (me ? of(me) : throwError(() => new Error('unauthenticated'))),
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [NgoProfileComponent],
      // provideRouter: the page carries a back link to the settings landing.
      providers: [provideRouter([]), { provide: AuthService, useValue: authStub }],
    });
    fixture = TestBed.createComponent(NgoProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function values(): string[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.detail-list dd'))
      .map(dd => (dd as HTMLElement).textContent!.trim());
  }

  it('renders the organisation details from /auth/me', () => {
    setup(ORG);
    expect(values()).toEqual([
      'Hope Health Initiative',
      'RC-1234567',
      '01234567-0001',
      'SC-998877',
      'admin@hopehealth.org',
      'https://hopehealth.org',
      'Lagos, Ogun, Oyo',
      'NG',
      'Maternal health, HIV/AIDS',
    ]);
    expect(fixture.nativeElement.querySelector('.profile-card__bio').textContent.trim())
      .toBe('Free antenatal care across three states.');
  });

  it('shows the verified badge for an active organisation', () => {
    setup(ORG);
    expect(fixture.nativeElement.querySelector('.status-badge').textContent.trim()).toBe('✓ Verified NGO');
  });

  it('ticks every checklist item when all fields were submitted', () => {
    setup(ORG);
    expect(component.docs().every(d => d.submitted)).toBeTrue();
    expect(fixture.nativeElement.querySelectorAll('.doc-item').length).toBe(6);
    expect(fixture.nativeElement.querySelectorAll('.doc-item__label--missing').length).toBe(0);
  });

  // A field the backend never received should read as missing, not as blank.
  it('marks a missing field on the checklist and renders an em dash for it', () => {
    setup({ ...ORG, scumlNumber: undefined });
    expect(component.docs().find(d => d.label === 'SCUML Certificate No.')!.submitted).toBeFalse();
    expect(values()[3]).toBe('—');
  });

  it('shows the rejection reason for a rejected organisation', () => {
    setup({ ...ORG, status: 'rejected', rejectionReason: 'Registration number could not be verified.' });
    expect(fixture.nativeElement.textContent).toContain('Registration number could not be verified.');
  });

  it('renders a loading placeholder before /auth/me resolves', () => {
    setup(undefined);
    expect(component.org()).toBeNull();
    expect(fixture.nativeElement.querySelector('.page-header__sub').textContent.trim())
      .toBe('Loading your organisation details…');
    expect(fixture.nativeElement.querySelector('.detail-list')).toBeNull();
  });
});
