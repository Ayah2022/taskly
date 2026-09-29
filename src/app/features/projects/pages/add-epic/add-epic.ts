import { Component, inject, OnInit, signal } from '@angular/core';

import { form, FormField, maxLength, minLength, required, validate } from '@angular/forms/signals';

import { ActivatedRoute, Router } from '@angular/router';

import { HttpErrorResponse } from '@angular/common/http';

import type { CreateEpicModel } from '../../models/createEpic.model';
import { EpicsService } from '../../services/epics.service';
import { MembersService } from '../../services/members.service';
import { MemberModel } from '../../models/member.model';

@Component({
  selector: 'app-add-epic',
  standalone: true,
  imports: [FormField],
  templateUrl: './add-epic.html',
})
export class AddEpic implements OnInit {
  private readonly epicService = inject(EpicsService);
  private readonly membersService = inject(MembersService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // -----------------------------------------
  // State
  // -----------------------------------------

  readonly projectId = signal<string | null>(null);
  readonly projectMembers = signal<MemberModel[]>([]);
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly today = this.getToday();
  hasError = signal(false);

  // -----------------------------------------
  // Form model
  // -----------------------------------------

  readonly epicModel = signal<CreateEpicModel>({
    title: '',
    description: '',
    assignee_id: '',
    project_id: '',
    deadline: '',
  });

  // -----------------------------------------
  // Form
  // -----------------------------------------

  readonly epicForm = form(this.epicModel, (schema) => {
    required(schema.title);

    minLength(schema.title, 3);

    maxLength(schema.title, 100);

    maxLength(schema.description, 500);

    validate(schema.deadline, ({ value }) => {
      const deadline = value();

      // Deadline is optional.
      if (!deadline) {
        return null;
      }

      const today = this.getToday();

      if (deadline < today) {
        return {
          kind: 'pastDate',
        };
      }

      return null;
    });
  });

  private getToday(): string {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
  // -----------------------------------------
  // Lifecycle
  // -----------------------------------------

  async ngOnInit() {
    const projectId = this.route.snapshot.paramMap.get('projectId');

    this.projectId.set(projectId);
    if (!projectId) {
      return;
    }

    await this.loadProjectMembers(projectId);
  }

  async loadProjectMembers(projectId: string) {
    try {
      const members = await this.membersService.getProjectMembers(projectId);

      this.projectMembers.set(members);
      console.log('PROJECT MEMBERS:', this.projectMembers());
    } catch (error) {
      console.error('Failed to load project members:', error);
      this.hasError.set(true);
    }
  }

  // -----------------------------------------
  // Submit
  // -----------------------------------------
  onSubmit(event: SubmitEvent): void {
    event.preventDefault();

    console.log('FORM SUBMITTED');

    this.createEpic();
  }

  async createEpic(): Promise<void> {
    console.log('CREATE EPIC CALLED');

    console.log('FORM INVALID:', this.epicForm().invalid());

    if (this.epicForm().invalid()) {
      console.log('❌ STOPPED: FORM IS INVALID');
      console.log('FORM ERRORS:', this.epicForm().errors());
      return;
    }

    const projectId = this.projectId();

    console.log('PROJECT ID:', projectId);

    if (!projectId) {
      console.log('❌ STOPPED: NO PROJECT ID');
      return;
    }

    console.log('✅ ABOUT TO CALL API');

    this.submitting.set(true);
    this.submitError.set(null);

    try {
      await this.epicService.createEpic({
        ...this.epicModel(),
        project_id: projectId,
      });

      console.log('✅ API SUCCESS');

      await this.router.navigate(['/projects', projectId, 'epics']);
    } catch (error) {
      console.error('Failed to create epic:', error);
      this.submitError.set(this.getErrorMessage(error));
    } finally {
      this.submitting.set(false);
    }
  }

  // -----------------------------------------
  // Cancel
  // -----------------------------------------

  async cancel(): Promise<void> {
    const projectId = this.projectId();

    if (!projectId) {
      return;
    }

    await this.router.navigate(['/projects', projectId, 'epics']);
  }

  // -----------------------------------------
  // Error handling
  // -----------------------------------------

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

      return error.message || 'Failed to create epic. Try again later.';
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Failed to create epic. Try again later.';
  }
}
