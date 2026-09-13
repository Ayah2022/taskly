import { inject, Injectable } from '@angular/core';

import { StorageService } from './storage.service';
import type { LoginResponse } from '../../features/auth/models/login-response.model';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly storage = inject(StorageService);


  setSession(session: LoginResponse, rememberMe: boolean): void {
    this.storage.setSession(session, rememberMe);
  }

  isAuthenticated(): boolean {
     return this.storage.hasAccessToken();
  }

  getAccessToken(): string | null {
    return this.storage.getAccessToken();
  }


  logout(): void {
    this.storage.clearSession();
  }
}