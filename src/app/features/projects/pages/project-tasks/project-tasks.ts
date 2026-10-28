import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';

import { TasksService } from '../../services/tasks.service';
import { Task, TaskStatus } from '../../models/task.model';
import { AddTaskModal } from '../../../../shared/components/add-task-modal/add-task-modal';

import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TaskCardComponent } from '../../../../shared/components/task-card/task-card';
import { TaskDetailsModal } from '../../../../shared/components/task-details-modal/task-details-modal';

interface BoardColumn {
  status: TaskStatus;
  apiStatus: string;
  title: string;
  dotClass: string;
  countClass: string;
  tasks: Task[];
  loading: boolean;
  error: string | null;
  offset: number;
  totalCount: number | null;
  loadingMore: boolean;
  hasMore: boolean;
  loadMoreError: string | null;
}

@Component({
  selector: 'app-project-tasks',
  standalone: true,
  imports: [AddTaskModal, TaskCardComponent, TaskDetailsModal],
  templateUrl: './project-tasks.html',
})
export class ProjectTasks implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly tasksService = inject(TasksService);

  readonly projectId = signal<string | null>(null);
  readonly addTaskOpen = signal(false);
  readonly selectedStatus = signal<TaskStatus>('TO_DO');
  protected readonly showTaskDetails = signal(false);
  protected readonly selectedTaskId = signal<string | null>(null);

  private readonly pageSize = 10;
  readonly mobileTasks = signal<Task[]>([]);
  readonly mobileOffset = signal(0);
  readonly mobileTotalCount = signal<number | null>(null);
  readonly mobileLoading = signal(false);
  readonly mobileLoadingMore = signal(false);
  readonly mobileHasMore = signal(true);
  readonly mobileError = signal<string | null>(null);

  private readonly destroyRef = inject(DestroyRef);

  readonly searchTerm = signal('');

  private readonly searchInput$ = new Subject<string>();

  // Identifies the latest search, so older requests cannot overwrite it.
  private searchVersion = 0;

  readonly columns = signal<BoardColumn[]>([
    {
      status: 'TO_DO',
      apiStatus: 'TO DO',
      title: 'TO DO',
      dotClass: 'bg-slate-400',
      countClass: 'bg-blue-100 text-blue-900',
      tasks: [],
      loading: false,
      error: null,
      offset: 0,
      totalCount: null,
      loadingMore: false,
      hasMore: true,
      loadMoreError: null,
    },
    {
      status: 'IN_PROGRESS',
      apiStatus: 'IN PROGRESS',
      title: 'IN PROGRESS',
      dotClass: 'bg-blue-600',
      countClass: 'bg-blue-100 text-blue-900',
      tasks: [],
      loading: false,
      error: null,
      offset: 0,
      totalCount: null,
      loadingMore: false,
      hasMore: true,
      loadMoreError: null,
    },
    {
      status: 'BLOCKED',
      apiStatus: 'BLOCKED',
      title: 'BLOCKED',
      dotClass: 'bg-red-600',
      countClass: 'bg-red-100 text-red-800',
      tasks: [],
      loading: false,
      error: null,
      offset: 0,
      totalCount: null,
      loadingMore: false,
      hasMore: true,
      loadMoreError: null,
    },
    {
      status: 'IN_REVIEW',
      apiStatus: 'IN REVIEW',
      title: 'IN REVIEW',
      dotClass: 'bg-slate-600',
      countClass: 'bg-slate-200 text-slate-800',
      tasks: [],
      loading: false,
      error: null,
      offset: 0,
      totalCount: null,
      loadingMore: false,
      hasMore: true,
      loadMoreError: null,
    },
    {
      status: 'READY_FOR_QA',
      apiStatus: 'READY FOR QA',
      title: 'READY FOR QA',
      dotClass: 'bg-purple-600',
      countClass: 'bg-purple-100 text-purple-800',
      tasks: [],
      loading: false,
      error: null,
      offset: 0,
      totalCount: null,
      loadingMore: false,
      hasMore: true,
      loadMoreError: null,
    },
    {
      status: 'REOPENED',
      apiStatus: 'REOPENED',
      title: 'REOPENED',
      dotClass: 'bg-orange-500',
      countClass: 'bg-orange-100 text-orange-800',
      tasks: [],
      loading: false,
      error: null,
      offset: 0,
      totalCount: null,
      loadingMore: false,
      hasMore: true,
      loadMoreError: null,
    },
    {
      status: 'READY_FOR_PRODUCTION',
      apiStatus: 'READY FOR PRODUCTION',
      title: 'READY FOR PRODUCTION',
      dotClass: 'bg-teal-600',
      countClass: 'bg-teal-100 text-teal-800',
      tasks: [],
      loading: false,
      error: null,
      offset: 0,
      totalCount: null,
      loadingMore: false,
      hasMore: true,
      loadMoreError: null,
    },
    {
      status: 'DONE',
      apiStatus: 'DONE',
      title: 'DONE',
      dotClass: 'bg-green-600',
      countClass: 'bg-green-100 text-green-800',
      tasks: [],
      loading: false,
      error: null,
      offset: 0,
      totalCount: null,
      loadingMore: false,
      hasMore: true,
      loadMoreError: null,
    },
  ]);

  constructor() {
    this.searchInput$
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((term) => {
        this.applySearch(term);
      });
  }

  ngOnInit(): void {
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

    // Load the desktop board columns.
    this.loadBoard();

    // If the initial viewport is mobile, load its independent task list too.
    if (window.matchMedia('(max-width: 767px)').matches) {
      this.loadMobilePage();
    }
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.searchInput$.next(input.value.trim());
  }

  private applySearch(term: string): void {
    this.searchTerm.set(term);

    // Invalidate responses belonging to the previous search.
    this.searchVersion++;

    // Reset desktop pagination and remove results from the previous search.
    this.columns.update((columns) =>
      columns.map((column) => ({
        ...column,
        tasks: [],
        loading: false,
        error: null,
        offset: 0,
        totalCount: null,
        loadingMore: false,
        hasMore: true,
        loadMoreError: null,
      })),
    );

    // Reset mobile pagination as well.
    this.mobileTasks.set([]);
    this.mobileOffset.set(0);
    this.mobileTotalCount.set(null);
    this.mobileLoading.set(false);
    this.mobileLoadingMore.set(false);
    this.mobileHasMore.set(true);
    this.mobileError.set(null);

    // Reload with the latest term. An empty term fetches all project tasks.
    this.loadBoard();

    if (window.matchMedia('(max-width: 767px)').matches) {
      this.loadMobilePage();
    }
  }
  loadBoard(): void {
    console.log('loadBoard called', this.projectId());

    for (const column of this.columns()) {
      console.log('Loading column:', column.status);
      this.loadColumn(column.status);
    }
  }

  loadColumn(status: TaskStatus, append = false): void {
    const projectId = this.projectId();
    const currentColumn = this.columns().find((column) => column.status === status);

    if (!projectId || !currentColumn) return;

    if (append) {
      if (currentColumn.loading || currentColumn.loadingMore || !currentColumn.hasMore) {
        return;
      }
    } else if (currentColumn.loading) {
      return;
    }

    const offset = append ? currentColumn.offset : 0;

    this.updateColumn(status, {
      ...(append ? { loadingMore: true, loadMoreError: null } : { loading: false, error: null }),
    });
    const requestVersion = this.searchVersion;
    this.tasksService
      .getTasksPage(projectId, this.pageSize, offset, status, this.searchTerm())
      .subscribe({
        next: (response) => {
          if (requestVersion !== this.searchVersion) {
            return;
          }
          const page = response.body ?? [];
          const total = this.parseTotalCount(response);

          // Read the latest column state after the request completes.
          const latestColumn = this.columns().find((column) => column.status === status);

          if (!latestColumn) return;

          this.updateColumn(status, {
            tasks: append
              ? this.mergeUniqueTasks(latestColumn.tasks, page)
              : this.mergeUniqueTasks([], page),
            offset: offset + page.length,
            totalCount: total ?? latestColumn.totalCount,
            hasMore: total !== null ? offset + page.length < total : page.length === this.pageSize,
            loading: false,
            loadingMore: false,
            error: null,
            loadMoreError: null,
          });
        },
        error: (error: HttpErrorResponse) => {
          if (requestVersion !== this.searchVersion) {
            return;
          }
          const message =
            error.status === 401
              ? 'Your session may have expired. Please sign in again.'
              : error.status === 403
                ? 'You do not have permission to view these tasks.'
                : 'Unable to load tasks. Please try again.';

          this.updateColumn(status, {
            loading: false,
            loadingMore: false,
            ...(append ? { loadMoreError: message } : { error: message }),
          });
        },
      });
  }

  //helper to prevent duplicates

  private mergeUniqueTasks(existing: Task[], incoming: Task[]): Task[] {
    const tasksById = new Map<string, Task>();

    for (const task of existing) {
      tasksById.set(task.id, task);
    }

    for (const task of incoming) {
      if (!tasksById.has(task.id)) {
        tasksById.set(task.id, task);
      }
    }

    return [...tasksById.values()];
  }

  loadMobilePage(append = false): void {
    const projectId = this.projectId();

    if (!projectId) return;

    if (this.mobileLoading() || this.mobileLoadingMore() || !this.mobileHasMore()) {
      return;
    }

    if (append) {
      this.mobileLoadingMore.set(true);
      this.mobileError.set(null);
    } else {
      this.mobileLoading.set(true);
      this.mobileError.set(null);
    }

    const offset = append ? this.mobileOffset() : 0;
    const requestVersion = this.searchVersion;
    this.tasksService
      .getTasksPage(projectId, this.pageSize, offset, undefined, this.searchTerm())
      .subscribe({
        next: (response) => {
          if (requestVersion !== this.searchVersion) {
            return;
          }
          const page = response.body ?? [];
          const total = this.parseTotalCount(response);

          this.mobileTasks.update((existing) =>
            append ? this.mergeUniqueTasks(existing, page) : this.mergeUniqueTasks([], page),
          );

          this.mobileOffset.set(offset + page.length);

          if (total !== null) {
            this.mobileTotalCount.set(total);
          }

          const knownTotal = total ?? this.mobileTotalCount();

          this.mobileHasMore.set(
            knownTotal !== null ? offset + page.length < knownTotal : page.length === this.pageSize,
          );

          this.mobileLoading.set(false);
          this.mobileLoadingMore.set(false);
        },
        error: (error: HttpErrorResponse) => {
          if (requestVersion !== this.searchVersion) {
            return;
          }
          this.mobileLoading.set(false);
          this.mobileLoadingMore.set(false);

          this.mobileError.set(
            error.status === 401
              ? 'Your session may have expired. Please sign in again.'
              : error.status === 403
                ? 'You do not have permission to view these tasks.'
                : 'Unable to load tasks. Please try again.',
          );
        },
      });
  }

  protected openTaskDetails(taskId: string): void {
    if (!this.projectId()) {
      return;
    }

    this.selectedTaskId.set(taskId);
    this.showTaskDetails.set(true);
  }
  protected closeTaskDetails(): void {
    this.showTaskDetails.set(false);
    this.selectedTaskId.set(null);
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

  onColumnScroll(event: Event, status: TaskStatus): void {
    const element = event.target as HTMLElement;

    const remaining = element.scrollHeight - element.scrollTop - element.clientHeight;

    if (remaining < 100) {
      this.loadColumn(status, true);
    }
  }

  onMobileScroll(event: Event): void {
    const element = event.target as HTMLElement;

    const remaining = element.scrollHeight - element.scrollTop - element.clientHeight;

    if (remaining < 150) {
      this.loadMobilePage(true);
    }
  }

  /** Show the mobile error state if every column failed and no tasks loaded. */
  mobileHasErrors(): boolean {
    const columns = this.columns();

    return columns.length > 0 && columns.every((column) => column.error !== null);
  }

  private updateColumn(status: TaskStatus, changes: Partial<BoardColumn>): void {
    this.columns.update((columns) =>
      columns.map((column) => (column.status === status ? { ...column, ...changes } : column)),
    );
  }

  private parseTotalCount(response: HttpResponse<Task[]>): number | null {
    const contentRange = response.headers.get('Content-Range');

    if (!contentRange) {
      return null;
    }

    const match = contentRange.trim().match(/^(?:\d+-\d+|\*)\/(\d+|\*)$/);

    if (!match || match[1] === '*') {
      return null;
    }

    const total = Number(match[1]);

    return Number.isSafeInteger(total) && total >= 0 ? total : null;
  }
}
