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
      // /projects/:projectId → /projects/:projectId/epics
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'epics',
      },
      // /projects/:projectId/epics
      {
        path: 'epics',
        loadComponent: () =>
          import('./pages/project-epics/project-epics').then((component) => component.ProjectEpics),

        data: {
          breadcrumb: 'Epics',
        },
      },

      // /projects/:projectId/edit
      {
        path: 'edit',
        loadComponent: () =>
          import('./pages/project-details/project-details').then(
            (component) => component.ProjectDetails,
          ),
        data: {
          breadcrumb: 'Edit',
        },
      },

      // /projects/:projectId/tasks
      {
        path: 'tasks',
        loadComponent: () =>
          import('./pages/project-tasks/project-tasks').then((component) => component.ProjectTasks),
        data: {
          breadcrumb: 'Tasks',
        },

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
      },

      // /projects/:projectId/members
      {
        path: 'members',
        loadComponent: () =>
          import('./pages/project-members/project-members').then(
            (component) => component.ProjectMembers,
          ),
        data: {
          breadcrumb: 'Members',
        },
      },
    ],
  },
];
