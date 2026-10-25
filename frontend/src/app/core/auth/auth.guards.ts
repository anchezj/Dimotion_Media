import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  try {
    if (await auth.getSession()) return true;
  } catch (error) {
    console.error('No se pudo verificar la sesión.', error);
  }
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

export const roleGuard: CanActivateFn = async (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const expectedRoles = route.data['roles'] as string[] | undefined;
  try {
    const role = await auth.getRole();
    if (role && expectedRoles?.includes(role)) {
      if (await auth.mustChangePassword()) return router.createUrlTree(['/cambiar-contrasena']);
      return true;
    }
  } catch (error) {
    console.error('No se pudo verificar el rol del usuario.', error);
  }
  return router.createUrlTree(['/']);
};
