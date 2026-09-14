import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const authenticated = await authService.restoreSession();

  console.log('AUTH GUARD:', authenticated);

  if (authenticated) {
    return true;
  }

  console.log('NO SESSION → LOGIN');
  //redirect to login if not authenticated

  return router.createUrlTree(['/login']);
};
