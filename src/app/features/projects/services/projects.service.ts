// projects.service.ts
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, map, Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import type { ProjectModel } from '../models/project.model';
export interface CreateProjectPayload {
  name: string;
  description: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  private readonly http = inject(HttpClient);

  private readonly endpoint = `${environment.apiUrl}/rest/v1/rpc/get_projects`;
  private readonly projectsEndpoint = `${environment.apiUrl}/rest/v1/projects`;
  async getProjects(): Promise<ProjectModel[]> {
    return firstValueFrom(
      this.http.post<ProjectModel[]>(
        this.endpoint,
        {},
        {
          headers: {
            apikey: environment.apiKey,
          },
        },
      ),
    );
  }

  async createProject(payload: CreateProjectPayload): Promise<ProjectModel> {
    return firstValueFrom(
      this.http.post<ProjectModel>(this.projectsEndpoint, payload, {
        headers: {
          apikey: environment.apiKey,
          Prefer: 'return=representation',
        },
      }),
    );
  }

  getProject(projectId: string): Observable<ProjectModel> {
    return this.http
      .get<ProjectModel[]>(`${this.projectsEndpoint}?id=eq.${projectId}`, {
        headers: {
          apikey: environment.apiKey,
        },
      })
      .pipe(
        map((projects) => {
          const project = projects[0];

          if (!project) {
            throw new Error('Project not found.');
          }

          return project;
        }),
      );
  }

  async updateProject(
    projectId: string,
    payload: {
      name: string;
      description: string;
    },
  ): Promise<ProjectModel> {
    const projects = await firstValueFrom(
      this.http.patch<ProjectModel[]>(
        `${this.projectsEndpoint}?id=eq.${encodeURIComponent(projectId)}`,
        payload,
        {
          headers: {
            apikey: environment.apiKey,
            Prefer: 'return=representation',
          },
        },
      ),
    );

    const project = projects[0];

    if (!project) {
      throw new Error('Project not found.');
    }

    return project;
  }
}
