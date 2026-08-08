import { CanActivateFn } from '@angular/router';
import { roleGuard } from './role.guard';

/** The admin portal has its own login route rather than one under /auth/:role/login. */
export const adminGuard: CanActivateFn = roleGuard('admin', ['/admin/login']);
