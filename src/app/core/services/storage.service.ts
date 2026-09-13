import { Injectable } from '@angular/core';
import type { LoginResponse } from '../../features/auth/models/login-response.model';
@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly sessionKey = 'taskly_session';

  setSession(session: LoginResponse, rememberMe: boolean): void {
    const storage = rememberMe ? localStorage : sessionStorage;

    storage.setItem(this.sessionKey, JSON.stringify(session));
  }

  getSession(): LoginResponse | null {
    const session =
      localStorage.getItem(this.sessionKey) ??
      sessionStorage.getItem(this.sessionKey);

    if (!session) {
      return null;
    }

    return JSON.parse(session) as LoginResponse;
  }


  getAccessToken(): string | null {
    return this.getSession()?.access_token ?? null;
  }

  clearSession(): void {
    localStorage.removeItem(this.sessionKey);
    sessionStorage.removeItem(this.sessionKey);
  }

  hasAccessToken(): boolean {
    return !!this.getAccessToken();
  }
}