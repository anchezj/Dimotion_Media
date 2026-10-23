import { HttpInterceptorFn } from '@angular/common/http';
import { from, switchMap } from 'rxjs';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(`${environment.apiUrl}/`)) return next(request);

  const auth = inject(AuthService);
  return from(auth.getSession()).pipe(
    switchMap((session) => {
      if (!session?.access_token) return next(request);
      return next(request.clone({
        setHeaders: { Authorization: `Bearer ${session.access_token}` },
      }));
    }),
  );
};
