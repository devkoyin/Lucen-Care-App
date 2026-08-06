import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Role } from './auth.models';

/**
 * Restricts a portal to accounts holding its role, so a signed-in user cannot
 * reach another portal by typing its URL. The API's own RoleGuard is the real
 * boundary; this keeps the client from rendering a portal it has no data for.
 *
 * `redirectTo` is parameterised because the admin portal has its own login route
 * (`/admin/login`) rather than one under `/auth/:role/login`.
 */
export const roleGuard = (allowed: Role, redirectTo: string[]): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated() && auth.role() === allowed) return true;

  return router.createUrlTree(redirectTo);
};
