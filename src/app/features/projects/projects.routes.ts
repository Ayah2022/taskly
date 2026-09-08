import type { Routes } from '@angular/router';

export const PROJECTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/projects/projects').then(
        (component) => component.Projects,
      ),
  },
];