import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { verifiedGuard } from './verified.guard';
import { AuthService } from './auth.service';
import { MeResponse, Role, UserStatus } from './auth.models';

function makeMe(role: Role, status: UserStatus, extra: Partial<MeResponse> = {}): MeResponse {
  return { id: 'U1', email: 't@x.com', role, status, ...extra };
}

describe('verifiedGuard', () => {
  function run(
    guardRole: Role,
    me: MeResponse | null,
    pendingRoute = `/${guardRole}/pending`,
  ): Promise<boolean | UrlTree> {
    const authStub = {
      me: () => (me ? of(me) : throwError(() => new Error('unauthenticated'))),
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [provideRouter([]), { provide: AuthService, useValue: authStub }],
    });
    const result = TestBed.runInInjectionContext(() =>
      verifiedGuard(guardRole, pendingRoute)({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as Observable<boolean | UrlTree>;
    return new Promise(resolve => result.subscribe(resolve));
  }

  it('allows a verified account into its own portal', async () => {
    expect(await run('ngo', makeMe('ngo', 'active'))).toBeTrue();
  });

  // The bug this closes: a pending NGO reaching every page in the portal.
  it('redirects a pending account to the pending screen', async () => {
    expect((await run('ngo', makeMe('ngo', 'pending'))) instanceof UrlTree).toBeTrue();
  });

  it('redirects a suspended account', async () => {
    expect((await run('ngo', makeMe('ngo', 'suspended'))) instanceof UrlTree).toBeTrue();
  });

  it('redirects when the role does not match the portal', async () => {
    expect((await run('ngo', makeMe('patient', 'active'))) instanceof UrlTree).toBeTrue();
  });

  it('redirects when /auth/me fails', async () => {
    expect((await run('ngo', null)) instanceof UrlTree).toBeTrue();
  });

  it('redirects to the pending route it was given', async () => {
    const result = (await run('hmo', makeMe('hmo', 'pending'))) as UrlTree;
    expect(result.toString()).toBe('/hmo/pending');
  });

  // Status is the single rule for all four roles that need approval.
  ([
    ['ngo', 'ngo'],
    ['hmo', 'hmo'],
    ['professional', 'professional'],
    ['benefactor', 'benefactor'],
  ] as Array<[Role, string]>).forEach(([role]) => {
    it(`gates ${role} on status alone`, async () => {
      expect(await run(role, makeMe(role, 'active'))).toBeTrue();
      expect((await run(role, makeMe(role, 'pending'))) instanceof UrlTree).toBeTrue();
    });
  });

  // Previously the professional/benefactor guards read application.status === 'approved',
  // which let a suspended-after-approval account straight through.
  it('blocks a suspended account whose application is still marked approved', async () => {
    const me = makeMe('professional', 'suspended', {
      application: { id: 'A1', status: 'approved', submittedAt: '2026-01-01' },
    });
    expect((await run('professional', me)) instanceof UrlTree).toBeTrue();
  });
});
