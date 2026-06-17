import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { professionalApprovedGuard } from './professional-approved.guard';
import { AuthService } from './auth.service';
import { ProfessionalApplicationsService } from '../applications/professional-applications.service';

describe('professionalApprovedGuard', () => {
  let auth: AuthService;
  let apps: ProfessionalApplicationsService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    auth = TestBed.inject(AuthService);
    apps = TestBed.inject(ProfessionalApplicationsService);
  });

  function runGuard(): boolean | UrlTree {
    return TestBed.runInInjectionContext(() =>
      professionalApprovedGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    ) as boolean | UrlTree;
  }

  it('redirects to pending when not authenticated', () => {
    expect(runGuard() instanceof UrlTree).toBeTrue();
  });

  it('redirects to pending when the professional application is not approved', () => {
    auth.signup('professional', { name: 'Dr. Jane', email: 'jane@doe.com', password: 'password123' }).subscribe();
    apps.submit({
      fullName: 'Dr. Jane', email: 'jane@doe.com', phone: '0800', profession: 'Doctor',
      licenseNumber: 'LIC-1', specialty: 'Cardiology', yearsOfExperience: 5, bio: 'bio', docs: [],
    });
    expect(runGuard() instanceof UrlTree).toBeTrue();
  });

  it('allows access once the professional application is approved', () => {
    auth.signup('professional', { name: 'Dr. Jane', email: 'jane@doe.com', password: 'password123' }).subscribe();
    apps.submit({
      fullName: 'Dr. Jane', email: 'jane@doe.com', phone: '0800', profession: 'Doctor',
      licenseNumber: 'LIC-1', specialty: 'Cardiology', yearsOfExperience: 5, bio: 'bio', docs: [],
    });
    apps.approve(apps.applications()[0].id);
    expect(runGuard()).toBeTrue();
  });
});
