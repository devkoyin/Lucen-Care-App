import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { roleGuard } from './role.guard';
import { AuthService } from './auth.service';
import { Role, User } from './auth.models';

function makeUser(role: Role): User {
  return { id: '1', role, name: 'Test', email: 't@x.com', status: 'active' };
}

describe('roleGuard', () => {
  function run(guardRole: Role, user: User | null, redirectTo = ['/auth', guardRole, 'login']) {
    const authStub = {
      isAuthenticated: () => user !== null,
      role: () => user?.role ?? null,
      user: signal(user),
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [provideRouter([]), { provide: AuthService, useValue: authStub }],
    });
    return TestBed.runInInjectionContext(() =>
      roleGuard(guardRole, redirectTo)({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
  }

  it('allows a user whose role matches the portal', () => {
    expect(run('ngo', makeUser('ngo'))).toBeTrue();
  });

  it('redirects an unauthenticated visitor', () => {
    expect(run('ngo', null) instanceof UrlTree).toBeTrue();
  });

  // The bug this guard closes: a signed-in patient typing /ngo/dashboard.
  it('redirects a signed-in patient away from the NGO portal', () => {
    expect(run('ngo', makeUser('patient')) instanceof UrlTree).toBeTrue();
  });

  it('redirects an NGO admin away from the HMO portal', () => {
    expect(run('hmo', makeUser('ngo')) instanceof UrlTree).toBeTrue();
  });

  it('redirects to the portal login route it was given', () => {
    const result = run('hmo', makeUser('patient')) as UrlTree;
    expect(result.toString()).toBe('/auth/hmo/login');
  });

  it('honours a custom redirect target', () => {
    const result = run('admin', makeUser('patient'), ['/admin/login']) as UrlTree;
    expect(result.toString()).toBe('/admin/login');
  });
});
