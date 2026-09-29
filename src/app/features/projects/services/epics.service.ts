import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';
import type { CreateEpicModel } from '../models/createEpic.model';

@Injectable({
  providedIn: 'root',
})
export class EpicsService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = environment.apiUrl;

  async createEpic(epic: CreateEpicModel): Promise<void> {
    const payload = {
      ...epic,
      assignee_id: epic.assignee_id || null,
      deadline: epic.deadline || null,
    };

    await firstValueFrom(this.http.post<void>(`${this.baseUrl}/rest/v1/epics`, payload));
  }
}
