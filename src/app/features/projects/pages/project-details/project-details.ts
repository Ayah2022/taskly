import { Component, inject, OnInit, signal } from '@angular/core';
import { form, FormField, maxLength, minLength, required } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import type { AddProjectModel } from '../../models/addProject.model';
import { ProjectsService } from '../../services/projects.service';

@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [FormField, RouterLink],
  templateUrl: './project-details.html',
})
export class ProjectDetails implements OnInit {
  private readonly projectService = inject(ProjectsService);
  private readonly router = inject(Router);
  readonly projectId = signal<string | null>(null);
  private readonly route = inject(ActivatedRoute);
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly projectModel = signal<AddProjectModel>({
    name: '',
    description: '',
  });

  readonly projectForm = form(this.projectModel, (schema) => {
    required(schema.name);

    minLength(schema.name, 3);

    maxLength(schema.name, 100);

    maxLength(schema.description, 500);
  });

  ngOnInit(): void {
    this.loadProject();
  }

  private loadProject(): void {
    const projectRoute = this.route.parent;

    const projectId = projectRoute?.snapshot.paramMap.get('projectId');
    const project = projectRoute?.snapshot.data['project'];

    if (!projectId || !project) {
      return;
    }

    this.projectId.set(projectId);

    this.projectModel.set({
      name: project.name,
      description: project.description,
    });
  }
  async saveProject(): Promise<void> {
    if (this.projectForm().invalid()) {
      return;
    }

    const projectId = this.projectId();

    if (!projectId) {
      return;
    }

    this.submitting.set(true);
    this.submitError.set(null);
    this.successMessage.set(null);

    try {
      await this.projectService.updateProject(projectId, this.projectModel());

      this.successMessage.set('Project updated successfully');

      await new Promise((resolve) => setTimeout(resolve, 1500));

      await this.router.navigate(['/projects', projectId, 'epics']);
    } catch (error) {
      console.error('Failed to update project:', error);

      this.submitError.set(this.getErrorMessage(error));
    } finally {
      this.submitting.set(false);
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const apiError = error.error;

      if (typeof apiError === 'string') {
        return apiError;
      }

      if (apiError?.message) {
        return apiError.message;
      }

      if (apiError?.error) {
        return apiError.error;
      }

      return error.message || 'Failed to add new project. Try again later.';
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Failed to add new project. Try again later.';
  }
}
