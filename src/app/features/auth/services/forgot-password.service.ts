import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';

interface ForgotPasswordPayload {
  email: string;
}

@Injectable({
  providedIn: 'root',
})
export class ForgotPasswordService {
  private readonly http = inject(HttpClient);

  private readonly endpoint = `${environment.apiUrl}/auth/v1/recover`;

  async sendResetLink(email: string): Promise<void> {
    const payload: ForgotPasswordPayload = {
      email,
    };

    await firstValueFrom(
      this.http.post<void>(this.endpoint, payload, {
        headers: {
          apikey: environment.apiKey,
          'Content-Type': 'application/json',
        },
      }),
    );
  }
}
