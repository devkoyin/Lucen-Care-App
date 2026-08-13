import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Role } from './auth.models';

/**
 * Gates a portal on the server's view of the account: the right role AND a verified
 * (`active`) status. Admin approval is what flips status to `active`, and it happens
 * long after the access token was issued, so the token itself can never reveal it —
 * hence reading `/auth/me` rather than the locally cached user.
 *
 * `status === 'active'` is the single rule for all four roles that need approval.
 * NGO/HMO have their review recorded on the organisation and professional/benefactor
 * on their own application row, but approval sets `users.status` in the same
 * transaction either way, so the guard needs no per-role branching.
 *
 * Attach this to the portal's LEAF routes and keep `pending` as an unguarded sibling.
 * Putting it on the parent route while redirecting to a child of that parent loops.
 */
export const verifiedGuard = (allowed: Role, pendingRoute: string): CanActivateFn =>
  (): Observable<boolean | UrlTree> => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const pending = router.createUrlTree([pendingRoute]);

    return auth.me().pipe(
      map(me => (me.role === allowed && me.status === 'active' ? true : pending)),
      catchError(() => of(pending)),
    );
  };
