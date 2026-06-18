import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { benefactorApprovedGuard } from './benefactor-approved.guard';
import { AuthService } from './auth.service';
import { BenefactorApplicationsService } from '../applications/benefactor-applications.service';

describe('benefactorApprovedGuard', () => {
  let auth: AuthService;
  let apps: BenefactorApplicationsService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    auth = TestBed.inject(AuthService);
    apps = TestBed.inject(BenefactorApplicationsService);
  });

  function runGuard(): boolean | UrlTree {
    return TestBed.runInInjectionContext(() =>
      benefactorApprovedGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    ) as boolean | UrlTree;
  }

  it('redirects to pending when not authenticated', () => {
    expect(runGuard() instanceof UrlTree).toBeTrue();
  });

  it('redirects to pending when the benefactor application is not approved', () => {
    auth.signup('benefactor', { name: 'Ada Obi', email: 'ada@test.com', password: 'password123' }).subscribe();
    apps.submit({ fullName: 'Ada Obi', email: 'ada@test.com', phone: '0800', reasonForSupport: 'I want to help', docs: [] });
    expect(runGuard() instanceof UrlTree).toBeTrue();
  });

  it('allows access once the benefactor application is approved', () => {
    auth.signup('benefactor', { name: 'Ada Obi', email: 'ada@test.com', password: 'password123' }).subscribe();
    apps.submit({ fullName: 'Ada Obi', email: 'ada@test.com', phone: '0800', reasonForSupport: 'I want to help', docs: [] });
    apps.approve(apps.applications()[0].id);
    expect(runGuard()).toBeTrue();
  });
});
