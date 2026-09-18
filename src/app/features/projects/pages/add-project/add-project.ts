import { Component, inject, signal } from '@angular/core';
import { form, FormField, maxLength, minLength, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';

import type { AddProjectModel } from '../../models/addProject.model';
import { ProjectsService } from '../../services/projects.service';

@Component({
  selector: 'app-add-project',
  standalone: true,
  imports: [FormField, RouterLink],
  templateUrl: './add-project.html',
})
export class AddProject {
  private readonly projectService = inject(ProjectsService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);

  readonly projectModel = signal<AddProjectModel>({
    name: '',
    description: '',
  });

  readonly projectForm = form(this.projectModel, (schema) => {
    required(schema.name, {
      message: 'Project Name is required.',
    });

    minLength(schema.name, 3, {
      message: 'Project Name must be at least 3 characters.',
    });

    maxLength(schema.description, 500, {
      message: 'Description must not exceed 500 characters.',
    });
  });

  async submit(): Promise<void> {
    this.submitError.set(null);

    if (this.projectForm().invalid()) {
      this.projectForm().markAsTouched();
      return;
    }

    this.submitting.set(true);

    try {
      const project = await this.projectService.createProject(this.projectModel());

      await this.router.navigate(['/projects', project.id]);
    } catch (error) {
      console.error('Failed to create project:', error);

      this.submitError.set('Failed to add new project. Try again later.');
    } finally {
      this.submitting.set(false);
    }
  }
}
