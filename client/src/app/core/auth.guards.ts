import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token;
  const r = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(r).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.includes('/auth/login')) {
        auth.clear();
        router.navigateByUrl('/login');
      }
      return throwError(() => err);
    }),
  );
};

export const authGuard: CanActivateFn = (_r, state) => {
  const router = inject(Router);
  return inject(AuthService)
    .ensureUser()
    .pipe(map((u) => (u ? true : router.createUrlTree(['/login'], { queryParams: { redirect: state.url } }))));
};

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(AuthService)
    .ensureUser()
    .pipe(map((u) => (u?.role === 'ADMIN' ? true : router.createUrlTree(['/']))));
};

export const guestGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(AuthService)
    .ensureUser()
    .pipe(map((u) => (u ? router.createUrlTree(['/']) : true)));
};

export function errorMessage(err: unknown, fallback = 'Une erreur est survenue.'): string {
  const e = err as HttpErrorResponse;
  return e?.error?.message || (e?.status === 0 ? 'Serveur injoignable.' : fallback);
}
