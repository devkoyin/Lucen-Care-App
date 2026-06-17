import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ProfessionalApplicationsService } from '../applications/professional-applications.service';

export const professionalApprovedGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const apps   = inject(ProfessionalApplicationsService);
  const router = inject(Router);

  const user = auth.user();
  const application = user ? apps.findByEmail(user.email) : undefined;

  if (user?.role === 'professional' && application?.status === 'approved') {
    return true;
  }

  return router.createUrlTree(['/professional/pending']);
};
