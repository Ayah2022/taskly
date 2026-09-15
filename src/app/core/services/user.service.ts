import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { UserModel } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);

  private readonly endpoint = `${environment.apiUrl}/auth/v1/user`;

  async getCurrentUser(): Promise<UserModel> {
    return firstValueFrom(
      this.http.get<UserModel>(this.endpoint, {
        headers: {
          apikey: environment.apiKey,
        },
      }),
    );
  }
}
