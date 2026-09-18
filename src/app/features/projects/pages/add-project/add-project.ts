import { Component, inject, signal } from '@angular/core';
import { form, FormField, maxLength, minLength, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
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
  readonly successMessage = signal<string | null>(null);

  readonly projectModel = signal<AddProjectModel>({
    name: '',
    description: '',
  });

  readonly projectForm = form(this.projectModel, (schema) => {
    required(schema.name, {
      message: 'Project Title is required.',
    });

    minLength(schema.name, 3, {
      message: 'Project Title must be at least 3 characters.',
    });

    maxLength(schema.description, 500, {
      message: 'Description must not exceed 500 characters.',
    });
  });

  async submit(): Promise<void> {
    // Prevent duplicate submissions
    if (this.submitting()) {
      return;
    }

    // Clear previous API messages
    this.submitError.set(null);
    this.successMessage.set(null);

    // Stop if client-side validation fails
    if (this.projectForm().invalid()) {
      this.projectForm().markAsTouched();
      return;
    }

    this.submitting.set(true);

    try {
      await this.projectService.createProject(this.projectModel());

      // Clear form after successful API response
      this.projectForm().reset({
        name: '',
        description: '',
      });

      // Show success message
      this.successMessage.set('Project created successfully');
      // Wait before redirecting
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Redirect to projects
      await this.router.navigate(['/projects']);
    } catch (error) {
      console.error('Failed to create project:', error);

      // Preserve the form values.
      this.submitError.set(this.getErrorMessage(error));
    } finally {
      // Always re-enable the button
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
