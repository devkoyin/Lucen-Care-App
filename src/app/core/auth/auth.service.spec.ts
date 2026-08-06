import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { Role, User } from './auth.models';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

function userFixture(overrides: Partial<User> = {}): User {
  return {
    id: 'U1',
    role: 'patient',
    name: 'Alice',
    email: 'a@b.com',
    status: 'active',
    ...overrides,
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  /** Answers the pending auth request with the standard { data, traceId } envelope. */
  function flushAuth(path: string, user: User) {
    http.expectOne(`${API}${path}`).flush({ data: { accessToken: 'tok', user }, traceId: 't' });
  }

  it('creates', () => expect(service).toBeTruthy());

  it('is not authenticated by default', () => {
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.role()).toBeNull();
    expect(service.user()).toBeNull();
  });

  it('sets the user signal from the login response', () => {
    service.login('patient', { email: 'a@b.com', password: 'pass' }).subscribe();
    flushAuth('/auth/login', userFixture());

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.role()).toBe('patient');
    expect(service.user()?.email).toBe('a@b.com');
    expect(service.getAccessToken()).toBe('tok');
  });

  // The portal is part of the credential — the API rejects a mismatch, so the
  // selected role has to reach the server.
  it('sends the portal role alongside the login payload', () => {
    service.login('ngo', { email: 'o@n.com', password: 'pass' }).subscribe();

    const req = http.expectOne(`${API}/auth/login`);
    expect(req.request.body).toEqual({ email: 'o@n.com', password: 'pass', role: 'ngo' });
    req.flush({ data: { accessToken: 'tok', user: userFixture({ role: 'ngo' }) }, traceId: 't' });
  });

  it('sends role: admin from the admin login screen', () => {
    service.login('admin', { email: 'admin@lucen.io', password: 'pass' }).subscribe();

    const req = http.expectOne(`${API}/auth/login`);
    expect((req.request.body as { role: string }).role).toBe('admin');
    req.flush({ data: { accessToken: 'tok', user: userFixture({ role: 'admin' }) }, traceId: 't' });
  });

  it('surfaces the API 401 when signing in from the wrong portal', () => {
    let error: { status?: number } | undefined;
    service.login('ngo', { email: 'patient@x.com', password: 'pass' }).subscribe({
      error: e => (error = e),
    });

    http
      .expectOne(`${API}/auth/login`)
      .flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

    expect(error?.status).toBe(401);
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('sends the role alongside the signup payload', () => {
    service.signup('ngo', { role: 'ngo', name: 'Org', email: 'o@n.com', password: 'pass' }).subscribe();

    const req = http.expectOne(`${API}/auth/signup`);
    expect(req.request.body).toEqual({ role: 'ngo', name: 'Org', email: 'o@n.com', password: 'pass' });
    req.flush({ data: { accessToken: 'tok', user: userFixture() }, traceId: 't' });
  });

  // Status is decided server-side: patients are active immediately, every other
  // role stays pending until an admin approves them.
  ([
    ['patient', 'active'],
    ['ngo', 'pending'],
    ['professional', 'pending'],
    ['benefactor', 'pending'],
  ] as Array<[Role, User['status']]>).forEach(([role, status]) => {
    it(`reflects the server-assigned "${status}" status for a ${role} signup`, () => {
      service
        .signup(role, { role, name: 'Someone', email: 's@x.com', password: 'password123' })
        .subscribe();
      flushAuth('/auth/signup', userFixture({ role, status, name: 'Someone', email: 's@x.com' }));

      expect(service.user()?.status).toBe(status);
      expect(service.user()?.role).toBe(role);
      expect(service.user()?.name).toBe('Someone');
    });
  });

  it('clears user and token on signOut', () => {
    service.login('patient', { email: 'a@b.com', password: 'pass' }).subscribe();
    flushAuth('/auth/login', userFixture());

    service.signOut();
    http.expectOne(`${API}/auth/logout`).flush({});

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.user()).toBeNull();
    expect(service.getAccessToken()).toBeNull();
  });

  describe('me()', () => {
    const mePayload = {
      data: { id: 'U1', email: 'a@b.com', role: 'patient', status: 'active' },
      traceId: 't',
    };

    it('unwraps the envelope and refreshes the cached user', () => {
      let result: unknown;
      service.me().subscribe(r => (result = r));

      http.expectOne(`${API}/auth/me`).flush({
        data: {
          id: 'U1', email: 'jane@doe.com', role: 'professional', status: 'active', name: 'Dr. Jane',
          application: { id: 'APP1', status: 'approved', submittedAt: '2026-01-01' },
        },
        traceId: 't',
      });

      expect((result as { status: string }).status).toBe('active');
      expect(service.user()?.status).toBe('active');
      expect(service.meState()?.application?.status).toBe('approved');
    });

    // Route guards can activate several times during one navigation.
    it('shares one request across repeat calls', () => {
      service.me().subscribe();
      service.me().subscribe();

      const requests = http.match(`${API}/auth/me`);
      expect(requests.length).toBe(1);
      requests[0].flush(mePayload);
    });

    it('refetches after invalidateMe()', () => {
      service.me().subscribe();
      http.expectOne(`${API}/auth/me`).flush(mePayload);
      expect(service.meState()).not.toBeNull();

      service.invalidateMe();
      expect(service.meState()).toBeNull();

      service.me().subscribe();
      const refetch = http.match(`${API}/auth/me`);
      expect(refetch.length).toBe(1);
      refetch[0].flush(mePayload);
    });

    it('does not cache a failure', () => {
      let firstError: unknown;
      service.me().subscribe({ error: e => (firstError = e) });
      http.expectOne(`${API}/auth/me`).flush({}, { status: 401, statusText: 'Unauthorized' });
      expect(firstError).toBeTruthy();

      // A second call must hit the network again rather than replay the error.
      service.me().subscribe({ error: () => {} });
      const retry = http.match(`${API}/auth/me`);
      expect(retry.length).toBe(1);
      retry[0].flush({}, { status: 401, statusText: 'Unauthorized' });
    });
  });
});
