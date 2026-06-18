import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { BenefactorApplicationsService } from '../applications/benefactor-applications.service';

export const benefactorApprovedGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const apps = inject(BenefactorApplicationsService);
  const router = inject(Router);
  const user = auth.user();
  const application = user ? apps.findByEmail(user.email) : undefined;
  if (user?.role === 'benefactor' && application?.status === 'approved') return true;
  return router.createUrlTree(['/benefactor/pending']);
};
