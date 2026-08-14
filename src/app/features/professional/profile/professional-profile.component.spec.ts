import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ProfessionalProfileComponent } from './professional-profile.component';
import { AuthService } from '../../../core/auth/auth.service';
import { MeResponse } from '../../../core/auth/auth.models';
import { environment } from '../../../../environments/environment';

const BIO_URL = `${environment.apiUrl}/applications/professional/me/bio`;

const ME: MeResponse = {
  id: 'U1',
  email: 'jane@doe.com',
  role: 'professional',
  status: 'active',
  name: 'Dr. Jane Doe',
  application: {
    id: 'APP1',
    status: 'approved',
    submittedAt: '2026-03-12T09:24:00.000Z',
    phone: '0800',
    profession: 'Doctor',
    licenseNumber: 'LIC-1',
    specialty: 'Cardiology',
    yearsOfExperience: 5,
    bio: 'Original bio',
  },
};

describe('ProfessionalProfileComponent', () => {
  let fixture: ComponentFixture<ProfessionalProfileComponent>;
  let component: ProfessionalProfileComponent;
  let http: HttpTestingController;

  function setup(me: MeResponse | null = ME) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ProfessionalProfileComponent, HttpClientTestingModule],
      // provideRouter: the page carries a back link to the settings landing.
      providers: [provideRouter([]), { provide: AuthService, useValue: { me: () => of(me) } }],
    });
    fixture = TestBed.createComponent(ProfessionalProfileComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  }

  afterEach(() => http.verify());

  it('creates', () => {
    setup();
    expect(component).toBeTruthy();
  });

  it('renders the application from /auth/me', () => {
    setup();
    expect(component.application()?.specialty).toBe('Cardiology');
    expect(component.application()?.fullName).toBe('Dr. Jane Doe');
    expect(component.application()?.email).toBe('jane@doe.com');
  });

  it('renders nothing when the user has no application', () => {
    setup({ ...ME, application: undefined });
    expect(component.application()).toBeUndefined();
  });

  it('persists an edited bio to the API', () => {
    setup();
    component.startEditBio();
    component.bioDraft.set('Updated bio');
    component.saveBio();

    const req = http.expectOne(BIO_URL);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ bio: 'Updated bio' });
    req.flush({ data: { id: 'APP1', bio: 'Updated bio' }, traceId: 't' });

    expect(component.application()?.bio).toBe('Updated bio');
    expect(component.editingBio()).toBeFalse();
  });

  it('keeps the original bio when the save fails', () => {
    setup();
    component.startEditBio();
    component.bioDraft.set('Updated bio');
    component.saveBio();

    http.expectOne(BIO_URL).flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });

    expect(component.application()?.bio).toBe('Original bio');
    expect(component.editingBio()).toBeFalse();
  });

  it('cancelEditBio() discards the draft without calling the API', () => {
    setup();
    component.startEditBio();
    component.bioDraft.set('Discarded draft');
    component.cancelEditBio();

    http.expectNone(BIO_URL);
    expect(component.application()?.bio).toBe('Original bio');
    expect(component.editingBio()).toBeFalse();
  });
});
