import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { StorageService } from './storage.service';

import type { LoginResponse } from '../../features/auth/models/login';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);

  private readonly endpoint = `${environment.apiUrl}/auth/v1/token`;

  async refreshToken(): Promise<boolean> {
    const refreshToken = this.storage.getRefreshToken();

    if (!refreshToken) {
      this.storage.clearSession();
      return false;
    }

    try {
      const session = await firstValueFrom(
        this.http.post<LoginResponse>(
          `${this.endpoint}?grant_type=refresh_token`,
          {
            refresh_token: refreshToken,
          },
          {
            headers: {
              apikey: environment.apiKey,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      this.storage.updateSession(session);

      return true;
    } catch {
      this.storage.clearSession();

      return false;
    }
  }
}
