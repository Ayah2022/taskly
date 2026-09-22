import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';
import type { LoginModel } from '../models/login';
import type { LoginResponse } from '../models/login';
import { StorageService } from '../../../core/services/storage.service';

export interface LoginResult {
  ok: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private readonly http = inject(HttpClient);
  private readonly storageService = inject(StorageService);

  private readonly loginEndpoint = `${environment.apiUrl}/auth/v1/token`;
  private readonly logoutEndpoint = `${environment.apiUrl}/auth/v1/logout`;

  async login(data: LoginModel): Promise<LoginResult> {
    try {
      const session = await firstValueFrom(
        this.http.post<LoginResponse>(
          `${this.loginEndpoint}?grant_type=password`,
          {
            email: data.email,
            password: data.password,
          },
          {
            headers: {
              apikey: environment.apiKey,
              'Content-Type': 'application/json',
            },
          },
        ),
      );
      this.storageService.setSession(session, data.rememberMe);

      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        message: this.getLoginErrorMessage(error),
      };
    }
  }

  async logout(): Promise<LoginResult> {
    try {
      await firstValueFrom(
        this.http.post<void>(this.logoutEndpoint, null, {
          headers: {
            apikey: environment.apiKey,
          },
        }),
      );

      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        message: this.getLogoutErrorMessage(error),
      };
    } finally {
      this.storageService.clearSession();
    }
  }

  private getLoginErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.msg === 'string') {
        return error.error.msg;
      }

      if (typeof error.error?.message === 'string') {
        return error.error.message;
      }

      if (error.status === 400 || error.status === 401) {
        return 'Invalid email or password.';
      }

      if (error.status === 0) {
        return 'Unable to connect to the server.';
      }
    }

    return 'Unable to log in. Please try again.';
  }

  private getLogoutErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.msg === 'string') {
        return error.error.msg;
      }

      if (typeof error.error?.message === 'string') {
        return error.error.message;
      }

      if (error.status === 0) {
        return 'Unable to connect to the server.';
      }
    }

    return 'Unable to log out. Please try again.';
  }
}
