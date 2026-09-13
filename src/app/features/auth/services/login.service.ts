import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import type { LoginModel } from '../models/login.model';
import type { LoginResponse } from '../models/login-response.model';

export interface LoginResult {
  ok: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly endpoint = `${environment.apiUrl}/auth/v1/token`;

  async login(data: LoginModel): Promise<LoginResult> {
    try {
      const session = await firstValueFrom(
        this.http.post<LoginResponse>(
          `${this.endpoint}?grant_type=password`,
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
      this.authService.setSession(
        session,
        data.rememberMe,
      );

      return {
        ok: true
      };
    } catch (error) {
      return {
        ok: false,
        message: this.getErrorMessage(error),
      };
    }
  }

  private getErrorMessage(error: unknown): string {
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
}
