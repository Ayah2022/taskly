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

  getTasksByProjectAndStatus(projectId: string, status: TaskStatus): Observable<Task[]> {
    const params = new HttpParams()
      .set('project_id', `eq.${projectId}`)
      .set('status', `eq.${status}`);

    return this.http.get<Task[]>(this.projectTasksEndpoint, {
      params,
    });
  }
}
