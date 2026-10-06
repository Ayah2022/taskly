import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, map, Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import type { CreateEpicModel } from '../models/createEpic.model';
import { EpicModel, EpicPatch } from '../models/epic.model';


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
    searchTerm = '',
  ): Observable<HttpResponse<EpicModel[]>> {
    let params = new HttpParams()
      .set('project_id', `eq.${projectId}`)
      .set('limit', limit)
      .set('offset', offset)
      .set('order', 'created_at.desc');

    const term = searchTerm.trim();
    if (term) {
      // title param: it is only added when the trimmed term is non - empty
      params = params.set('title', `ilike.%${escapeLike(term)}%`);
    }

    return this.http.get<EpicModel[]>(this.endpoint, {
      params,
      observe: 'response',
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'count=exact',
      },
    });
  }

  updateEpic(id: string, patch: EpicPatch): Observable<void> {
    return this.http
      .patch<unknown[]>(`${this.baseUrl}/rest/v1/epics`, patch, {
        params: new HttpParams().set('id', `eq.${id}`),
        headers: { Prefer: 'return=representation' },
      })
      .pipe(
        map((rows) => {
          // PostgREST returns 200 with [] when no row matched (e.g. blocked by RLS)
          if (!rows.length) throw new Error('No epic was updated');
        }),
      );
  }
  
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
function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, '\\$&');
}
