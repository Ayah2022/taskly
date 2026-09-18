import type { Routes } from '@angular/router';

import { projectResolver } from './resolvers/project.resolver';

export const PROJECTS_ROUTES: Routes = [
  // /projects
  {
    path: '',
    loadComponent: () =>
      import('./pages/project-list/project-list').then((component) => component.ProjectList),
  },

  // /projects/add
  {
    path: 'add',
    loadComponent: () =>
      import('./pages/add-project/add-project').then((component) => component.AddProject),
    data: {
      breadcrumb: 'Add new project',
    },
  },

  // /projects/:projectId
  {
    path: ':projectId',
    resolve: {
      project: projectResolver,
    },
    data: {
      breadcrumb: 'project',
    },
    children: [
      // /projects/:projectId
      {
        path: '',
        loadComponent: () =>
          import('./pages/project-details/project-details').then(
            (component) => component.ProjectDetails,
          ),
      },

      // /projects/:projectId/edit
      // {
      //   path: 'edit',
      //   loadComponent: () =>
      //     import('./pages/edit-project/edit-project').then((component) => component.EditProject),
      //   data: {
      //     breadcrumb: 'Edit',
      //   },
      // },

      // /projects/:projectId/tasks
      // {
      //   path: 'tasks',
      //   loadComponent: () =>
      //     import('./pages/tasks/tasks').then(
      //       (component) => component.Tasks,
      //     ),
      //   data: {
      //     breadcrumb: 'Tasks',
      //   },

      //   children: [
      //     // /projects/:projectId/tasks/add
      //     {
      //       path: 'add',
      //       loadComponent: () =>
      //         import('./pages/add-task/add-task').then(
      //           (component) => component.AddTask,
      //         ),
      //       data: {
      //         breadcrumb: 'New Task',
      //       },
      //     },
      //   ],
      // },

      // // /projects/:projectId/epics
      // {
      //   path: 'epics',
      //   loadComponent: () =>
      //     import('./pages/epics/epics').then(
      //       (component) => component.Epics,
      //     ),
      //   data: {
      //     breadcrumb: 'Epics',
      //   },

      //   children: [
      //     // /projects/:projectId/epics/add
      //     {
      //       path: 'add',
      //       loadComponent: () =>
      //         import('./pages/add-epic/add-epic').then(
      //           (component) => component.AddEpic,
      //         ),
      //       data: {
      //         breadcrumb: 'New Epic',
      //       },
      //     },
      //   ],
      // },

      // // /projects/:projectId/members
      // {
      //   path: 'members',
      //   loadComponent: () =>
      //     import('./pages/members/members').then(
      //       (component) => component.Members,
      //     ),
      //   data: {
      //     breadcrumb: 'Members',
      //   },
      // },
    ],
  },
];
