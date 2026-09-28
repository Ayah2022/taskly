import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { MemberModel } from '../models/member.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MembersService {
  private readonly http = inject(HttpClient);

  async getProjectMembers(projectId: string): Promise<MemberModel[]> {
    const params = new HttpParams().set('project_id', `eq.${projectId}`);

    return firstValueFrom(
      this.http.get<MemberModel[]>(`${environment.apiUrl}/rest/v1/get_project_members`, { params }),
    );
  }
}
