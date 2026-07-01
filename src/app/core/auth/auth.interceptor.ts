import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from './auth.service';

// Endpoints that should NOT have Authorization header (they are the auth endpoints themselves)
const PUBLIC_PATHS = ['/auth/login', '/auth/signup', '/auth/refresh', '/auth/forgot-password', '/auth/reset-password', '/auth/request-otp'];

let isRefreshing = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isPublic = PUBLIC_PATHS.some(path => req.url.includes(path));
  const token = authService.getAccessToken();

  const authReq = (!isPublic && token)
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !isPublic) {
        return handle401(authService, router, req, next);
      }
      return throwError(() => err);
    }),
  );
};

function handle401(
  authService: AuthService,
  router: Router,
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) {
  if (isRefreshing) {
    return refreshSubject.pipe(
      filter((token): token is string => token !== null),
      take(1),
      switchMap(token =>
        next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })),
      ),
    );
  }

  isRefreshing = true;
  refreshSubject.next(null);

  return authService.refreshToken().pipe(
    switchMap(newToken => {
      isRefreshing = false;
      refreshSubject.next(newToken);
      return next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }));
    }),
    catchError(refreshErr => {
      isRefreshing = false;
      authService.signOut();
      router.navigate(['/auth/login']);
      return throwError(() => refreshErr);
    }),
  );
}
