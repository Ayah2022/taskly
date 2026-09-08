import type { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'sign-up',
    loadComponent: () =>
      import('./pages/signup/signup').then(
        (component) => component.Signup,
      ),
  },
];