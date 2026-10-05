import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, map, Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import type { CreateEpicModel } from '../models/createEpic.model';
import { EpicModel } from '../models/epic.model';

@Injectable({
  providedIn: 'root',
})
export class EpicsService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = environment.apiUrl;
  private readonly endpoint = `${environment.apiUrl}/rest/v1/project_epics`;

  async createEpic(epic: CreateEpicModel): Promise<void> {
    const payload = {
      ...epic,
      assignee_id: epic.assignee_id || null,
      deadline: epic.deadline || null,
    };

    await firstValueFrom(this.http.post<void>(`${this.baseUrl}/rest/v1/epics`, payload));
  }

  getProjectEpics(
    projectId: string,
    limit: number,
    offset: number,
  ): Observable<HttpResponse<EpicModel[]>> {
    const params = new HttpParams()
      .set('project_id', `eq.${projectId}`)
      .set('limit', limit)
      .set('offset', offset)
      .set('order', 'created_at.desc');

    return this.http.get<EpicModel[]>(this.endpoint, {
      params,
      observe: 'response',
      headers: {
        Prefer: 'count=exact',
      },
    });
  }

  // epics.service.ts
  getEpicById(projectId: string, epicId: string): Observable<EpicModel | null> {
    const params = new HttpParams()
      .set('project_id', `eq.${projectId}`)
      .set('id', `eq.${epicId}`)
      .set('limit', 1);

    // PostgREST returns an array; empty array => not found
    return this.http
      .get<EpicModel[]>(this.endpoint, { params })
      .pipe(map((rows) => rows[0] ?? null));
  }
}
