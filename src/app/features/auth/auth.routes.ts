import type { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'sign-up',
    loadComponent: () => import('./pages/signup/signup').then((component) => component.Signup),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((component) => component.Login),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./pages/forget-password/forget-password').then(
        (component) => component.ForgotPassword,
      ),
  },
];
