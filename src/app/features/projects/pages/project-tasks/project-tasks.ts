import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { TasksService } from '../../services/tasks.service';
import { Task, TaskStatus } from '../../models/task.model';
import { AddTaskModal } from '../../../../shared/components/add-task-modal/add-task-modal';

import { TaskCardComponent } from '../../../../shared/components/task-card/task-card';

interface BoardColumn {
  status: TaskStatus;
  apiStatus: string;
  title: string;
  dotClass: string;
  countClass: string;
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

@Component({
  selector: 'app-project-tasks',
  standalone: true,
  imports: [AddTaskModal, TaskCardComponent],
  templateUrl: './project-tasks.html',
})
export class ProjectTasks implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly tasksService = inject(TasksService);

  readonly projectId = signal<string | null>(null);
  readonly addTaskOpen = signal(false);
  readonly selectedStatus = signal<TaskStatus>('TO_DO');

  readonly columns = signal<BoardColumn[]>([
    {
      status: 'TO_DO',
      apiStatus: 'TO DO',
      title: 'TO DO',
      dotClass: 'bg-slate-400',
      countClass: 'bg-blue-100 text-blue-900',
      tasks: [],
      loading: true,
      error: null,
    },
    {
      status: 'IN_PROGRESS',
      apiStatus: 'IN PROGRESS',
      title: 'IN PROGRESS',
      dotClass: 'bg-blue-600',
      countClass: 'bg-blue-100 text-blue-900',
      tasks: [],
      loading: true,
      error: null,
    },
    {
      status: 'BLOCKED',
      apiStatus: 'BLOCKED',
      title: 'BLOCKED',
      dotClass: 'bg-red-600',
      countClass: 'bg-red-100 text-red-800',
      tasks: [],
      loading: true,
      error: null,
    },
    {
      status: 'IN_REVIEW',
      apiStatus: 'IN REVIEW',
      title: 'IN REVIEW',
      dotClass: 'bg-slate-600',
      countClass: 'bg-slate-200 text-slate-800',
      tasks: [],
      loading: true,
      error: null,
    },
    {
      status: 'READY_FOR_QA',
      apiStatus: 'READY FOR QA',
      title: 'READY FOR QA',
      dotClass: 'bg-purple-600',
      countClass: 'bg-purple-100 text-purple-800',
      tasks: [],
      loading: true,
      error: null,
    },
    {
      status: 'REOPENED',
      apiStatus: 'REOPENED',
      title: 'REOPENED',
      dotClass: 'bg-orange-500',
      countClass: 'bg-orange-100 text-orange-800',
      tasks: [],
      loading: true,
      error: null,
    },
    {
      status: 'READY_FOR_PRODUCTION',
      apiStatus: 'READY FOR PRODUCTION',
      title: 'READY FOR PRODUCTION',
      dotClass: 'bg-teal-600',
      countClass: 'bg-teal-100 text-teal-800',
      tasks: [],
      loading: true,
      error: null,
    },
    {
      status: 'DONE',
      apiStatus: 'DONE',
      title: 'DONE',
      dotClass: 'bg-green-600',
      countClass: 'bg-green-100 text-green-800',
      tasks: [],
      loading: true,
      error: null,
    },
  ]);

  ngOnInit(): void {
    // Keep the existing project route convention.
    const projectRoute = this.route.parent;
    const projectId = projectRoute?.snapshot.paramMap.get('projectId');
    const project = projectRoute?.snapshot.data['project'];

    if (!projectId || !project) {
      this.columns.update((columns) =>
        columns.map((column) => ({
          ...column,
          loading: false,
          error: 'Unable to identify the current project.',
        })),
      );
      return;
    }

    this.projectId.set(projectId);
    this.loadBoard();
  }

  loadBoard(): void {
    for (const column of this.columns()) {
      this.loadColumn(column.status);
    }
  }

  loadColumn(status: TaskStatus): void {
    const projectId = this.projectId();

    if (!projectId) {
      return;
    }

    this.updateColumn(status, {
      loading: true,
      error: null,
    });

    this.tasksService.getTasksByProjectAndStatus(projectId, status).subscribe({
      next: (tasks) => {
        this.updateColumn(status, {
          tasks,
          loading: false,
          error: null,
        });
      },
      error: (error: HttpErrorResponse) => {
        const message =
          error.status === 401
            ? 'Your session may have expired. Please sign in again.'
            : error.status === 403
              ? 'You do not have permission to view these tasks.'
              : 'Unable to load tasks. Please try again.';

        this.updateColumn(status, {
          loading: false,
          error: message,
        });
      },
    });
  }

  openAddTask(status: TaskStatus = 'TO_DO'): void {
    console.log(status, 'status');
    this.selectedStatus.set(status);

    this.addTaskOpen.set(true);
  }

  closeAddTask(): void {
    this.addTaskOpen.set(false);
  }

  onTaskCreated(): void {
    this.addTaskOpen.set(false);

    // Refresh each column independently after creation.
    this.loadBoard();
  }

  private updateColumn(status: TaskStatus, changes: Partial<BoardColumn>): void {
    this.columns.update((columns) =>
      columns.map((column) => (column.status === status ? { ...column, ...changes } : column)),
    );
  }
}
