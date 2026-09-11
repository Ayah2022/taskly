import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'sign-up',
  },

  {
    path: '',
    loadChildren: () => import('./features/auth/auth.routes').then((routes) => routes.AUTH_ROUTES),
  },

  {
    path: '',
    loadComponent: () => import('./layout/layout').then((component) => component.Layout),
    children: [
      {
        path: 'projects',
        loadChildren: () =>
          import('./features/projects/projects.routes').then((routes) => routes.PROJECTS_ROUTES),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'sign-up',
  },
];
