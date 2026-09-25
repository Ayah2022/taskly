// forgot-password.service.ts
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';

interface ForgotPasswordPayload {
  email: string;
}

interface UpdatePasswordPayload {
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class ForgotPasswordService {
  private readonly http = inject(HttpClient);

  private readonly recoverEndpoint = `${environment.apiUrl}/auth/v1/recover`;
  private readonly userEndpoint = `${environment.apiUrl}/auth/v1/user`;

  async sendResetLink(email: string): Promise<void> {
    const payload: ForgotPasswordPayload = { email };
    const redirectTo = `${window.location.origin}/reset-password`;

    await firstValueFrom(
      this.http.post<void>(`${this.recoverEndpoint}?redirect_to=${encodeURIComponent(redirectTo)}`, payload, {
        headers: {
          apikey: environment.apiKey,
          'Content-Type': 'application/json',
        },
      }),
    );
  }

  async updatePassword(accessToken: string, password: string): Promise<void> {
    const payload: UpdatePasswordPayload = {
      password,
    };

    await firstValueFrom(
      this.http.put<void>(this.userEndpoint, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: environment.apiKey,
          'Content-Type': 'application/json',
        },
      }),
    );
  }
}