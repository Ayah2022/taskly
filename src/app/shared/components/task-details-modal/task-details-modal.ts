import { DatePipe } from '@angular/common';
import { Component, inject, input, output, resource, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { TasksService } from '../../../features/projects/services/tasks.service';
import { Task } from '../../../features/projects/models/task.model';

@Component({
  selector: 'app-task-details-modal',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './task-details-modal.html',
  styleUrl: './task-details-modal.css',
})
export class TaskDetailsModal {
  private readonly tasksService = inject(TasksService);

  readonly projectId = input.required<string>();
  readonly taskId = input.required<string>();

  readonly closed = output<void>();

  protected readonly linkCopied = signal(false);

  protected readonly taskResource = resource({
    params: () => {
      const projectId = this.projectId();
      const taskId = this.taskId();

      if (!projectId || !taskId) {
        return undefined;
      }

      return { projectId, taskId };
    },

    loader: async ({ params }) => {
      const response = await firstValueFrom(
        this.tasksService.getTaskDetails(params.projectId, params.taskId),
      );

      const tasks = response.body ?? [];

      return tasks.length > 0 ? tasks[0] : null;
    },
  });

  protected get task(): Task | null {
    return this.taskResource.value() ?? null;
  }

  protected get taskReference(): string {
    return this.task?.task_id || 'TASK-—';
  }

  protected get statusLabel(): string {
    const status = this.task?.status;

    if (!status) {
      return 'Not specified';
    }

    const labels: Record<string, string> = {
      TO_DO: 'To Do',
      IN_PROGRESS: 'In Progress',
      BLOCKED: 'Blocked',
      IN_REVIEW: 'In Review',
      READY_FOR_QA: 'Ready for QA',
      REOPENED: 'Reopened',
      READY_FOR_PRODUCTION: 'Ready for Production',
      DONE: 'Done',
    };

    return labels[status] ?? status.replace(/_/g, ' ');
  }

  protected get assigneeName(): string {
    return this.task?.assignee?.name?.trim() || 'Unassigned';
  }

  protected get reporterName(): string {
    return this.task?.created_by?.name?.trim() || 'Unknown';
  }

  protected get assigneeInitials(): string {
    return this.getInitials(this.assigneeName);
  }

  protected get reporterInitials(): string {
    return this.getInitials(this.reporterName);
  }

  protected get epicLabel(): string {
    const epic = this.task?.epic;

    if (!epic) {
      return 'No epic assigned';
    }

    return [epic.epic_id, epic.title].filter(Boolean).join(' ') || 'No epic assigned';
  }

  protected get createdAt(): Date | null {
    return this.parseDate(this.task?.created_at);
  }

  protected get dueDate(): Date | null {
    return this.parseDate(this.task?.due_date);
  }

  protected get dueDateLabel(): string {
    return this.dueDate ? '' : 'No due date';
  }

  protected getInitials(name: string): string {
    if (!name || name === 'Unassigned' || name === 'Unknown') {
      return '--';
    }

    return name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  private parseDate(value: string | null | undefined): Date | null {
    if (!value) {
      return null;
    }

    const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00`)
      : new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  protected retry(): void {
    this.taskResource.reload();
  }

  protected closeModal(): void {
    this.closed.emit();
  }

  protected async copyLink(): Promise<void> {
    const task = this.task;

    if (!task) {
      return;
    }

    try {
      const url = new URL(window.location.href);

      url.searchParams.set('projectId', task.project_id);
      url.searchParams.set('taskId', task.id);

      await navigator.clipboard.writeText(url.toString());

      this.linkCopied.set(true);
    } catch (error) {
      console.error('Failed to copy task link:', error);
      this.linkCopied.set(false);
    }
  }
}
