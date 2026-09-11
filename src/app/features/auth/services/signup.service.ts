import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type { SignupModel } from '../models/signup.model';
import type { SignupRequest } from '../models/signup-request.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SignupService {
  private readonly http = inject(HttpClient);

  private readonly endpoint = `${environment.apiUrl}/auth/v1/signup`;

  async signup(model: SignupModel): Promise<{
    ok: boolean;
    message?: string;
  }> {
    const request: SignupRequest = {
      email: model.email,
      password: model.password,
      data: {
        name: model.name,
      },
    };

    /*
     * Job title is optional.
     * Only send it when the user actually provided it.
     */
    if (model.jobTitle.trim()) {
      request.data.job_title = model.jobTitle.trim();
    }

    try {
      await firstValueFrom(
        this.http.post(this.endpoint, request, {
          headers: {
            apikey: environment.apiKey,
            'Content-Type': 'application/json',
          },
        }),
      );

      return {
        ok: true,
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
      /*
       * API returned a useful error message.
       */
      if (typeof error.error?.message === 'string') {
        return error.error.message;
      }

      if (typeof error.error?.error_description === 'string') {
        return error.error.error_description;
      }

      if (typeof error.error?.msg === 'string') {
        return error.error.msg;
      }

      /*
       * Common HTTP errors.
       */
      if (error.status === 400) {
        return 'The signup information is invalid.';
      }

      if (error.status === 409) {
        return 'An account with this email already exists.';
      }

      if (error.status === 0) {
        return 'Unable to connect to the server. Please check your connection.';
      }
    }

    return 'Unable to create your account. Please try again.';
  }
}
