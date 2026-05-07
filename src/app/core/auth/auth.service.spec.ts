import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [AuthService] });
    service = TestBed.inject(AuthService);
  });

  it('creates', () => expect(service).toBeTruthy());

  it('is not authenticated by default', () => {
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.role()).toBeNull();
    expect(service.user()).toBeNull();
  });

  it('sets user signal on login', () => {
    service.login('patient', { email: 'a@b.com', password: 'pass' }).subscribe();
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.role()).toBe('patient');
    expect(service.user()?.email).toBe('a@b.com');
  });

  it('sets patient status to active on signup', () => {
    service.signup('patient', { name: 'Alice', email: 'a@b.com', password: 'pass' }).subscribe();
    expect(service.user()?.status).toBe('active');
    expect(service.user()?.name).toBe('Alice');
  });

  it('sets non-patient status to pending on signup', () => {
    service.signup('ngo', { name: 'Org', email: 'o@n.com', password: 'pass' }).subscribe();
    expect(service.user()?.status).toBe('pending');
    expect(service.user()?.role).toBe('ngo');
  });

  it('clears user on signOut', () => {
    service.login('patient', { email: 'a@b.com', password: 'pass' }).subscribe();
    service.signOut();
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.user()).toBeNull();
  });
});
