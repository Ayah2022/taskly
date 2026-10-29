import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CreateTaskRequest, Task, TaskStatus } from '../models/task.model';

@Injectable({
  providedIn: 'root',
})
export class TasksService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = environment.apiUrl;
  private readonly endpoint = `${this.baseUrl}/rest/v1/tasks`;
  private readonly projectTasksEndpoint = `${this.baseUrl}/rest/v1/project_tasks`;

  createTask(payload: CreateTaskRequest): Observable<Task> {
    return this.http.post<Task>(this.endpoint, payload);
  }

  getTasksByEpicId(epicId: string): Observable<Task[]> {
    return this.http.get<Task[]>(this.projectTasksEndpoint, {
      params: {
        epic_id: `eq.${epicId}`,
      },
    });
  }

  getTaskDetails(projectId: string, taskId: string): Observable<HttpResponse<Task[]>> {
    const params = new HttpParams()
      .set('project_id', `eq.${projectId}`)
      .set('id', `eq.${taskId}`)
      .set('select', '*');

    return this.http.get<Task[]>(this.projectTasksEndpoint, {
      params,
      observe: 'response',
    });
  }

  getTasksPage(
    projectId: string,
    limit: number,
    offset: number,
    status?: TaskStatus,
    searchTerm = '',
  ): Observable<HttpResponse<Task[]>> {
    let params = new HttpParams()
      .set('project_id', `eq.${projectId}`)
      .set('limit', limit)
      .set('offset', offset)
      .set('order', 'created_at.desc');

    const normalizedSearch = searchTerm.trim();

    if (normalizedSearch) {
      params = params.set('title', `ilike.%${normalizedSearch}%`);
    }

    if (status) {
      params = params.set('status', `eq.${status}`);
    }

    return this.http.get<Task[]>(this.projectTasksEndpoint, {
      params,
      observe: 'response',
    });
  }

  getTasksByProjectAndStatus(projectId: string, status: TaskStatus): Observable<Task[]> {
    const params = new HttpParams()
      .set('project_id', `eq.${projectId}`)
      .set('status', `eq.${status}`);

    return this.http.get<Task[]>(this.projectTasksEndpoint, {
      params,
    });
  }

  /**
   * Updates a task's status in the database.
   * Authentication and Supabase API headers are provided by the interceptor.
   *
   * Uses the task's database UUID, not its human-readable task_id.
   */
  updateTaskStatus(taskId: string, status: TaskStatus): Observable<void> {
    const params = new HttpParams().set('id', `eq.${taskId}`);

    return this.http.patch<void>(
      this.endpoint,
      { status },
      {
        params,
        headers: {
          Prefer: 'return=minimal',
        },
      },
    );
  }
}
