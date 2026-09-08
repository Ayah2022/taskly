import { Injectable } from '@angular/core';

import type { SignupModel } from '../models/signup.model';

export interface SignupResult {
  ok: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  async signup(data: SignupModel): Promise<SignupResult> {
    // Temporary mock implementation.
    // Replace this with the real API call when the backend is connected.
    await new Promise((resolve) => setTimeout(resolve, 1200));

    console.log('Signup payload:', data);

    return {
      ok: true,
    };
  }
}