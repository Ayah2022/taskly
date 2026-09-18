import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';

import { ProjectsService } from '../services/projects.service';
import type { ProjectModel } from '../models/project.model';

export const projectResolver: ResolveFn<ProjectModel> = (route) => {
  const projectService = inject(ProjectsService);

  const projectId = route.paramMap.get('projectId');

  if (!projectId) {
    throw new Error('Project ID is required.');
  }

  return projectService.getProject(projectId);
};
