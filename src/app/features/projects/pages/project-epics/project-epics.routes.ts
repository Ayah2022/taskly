import type { Routes } from '@angular/router';

export const EPICS_ROUTES: Routes = [
  // /projects/:projectId/epics
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('../epics-list/epics-list').then((component) => component.EpicsList),
    data: {
      breadcrumb: 'Epics',
    },
  },

  // /projects/:projectId/epics/new
  {
    path: 'new',
    loadComponent: () => import('../add-epic/add-epic').then((component) => component.AddEpic),
    data: {
      breadcrumb: 'New Epic',
    },
  },
];
