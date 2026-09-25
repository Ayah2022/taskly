import { Injectable } from '@angular/core';

import type { LoginResponse } from '../../features/auth/models/login';
import { Login } from '../../features/auth/pages/login/login';
import { LoginService } from '../../features/auth/services/login.service';

interface StoredSession {
  session: LoginResponse;
  rememberMe: boolean;
  rememberMeExpiresAt: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly sessionKey = 'taskly_session';

  setSession(session: LoginResponse, rememberMe: boolean): void {
   
    const storedSession: StoredSession = {
      session,
      rememberMe,
      rememberMeExpiresAt: rememberMe ? Date.now() + 30 * 24 * 60 * 60 * 1000 : null,
    };

    // Make sure an old session cannot remain in the other storage.
    localStorage.removeItem(this.sessionKey);
    sessionStorage.removeItem(this.sessionKey);

    const storage = rememberMe ? localStorage : sessionStorage;

    storage.setItem(this.sessionKey, JSON.stringify(storedSession));
  }

  getStoredSession(): StoredSession | null {
    const stored = localStorage.getItem(this.sessionKey) ?? sessionStorage.getItem(this.sessionKey);

    if (!stored) {
      return null;
    }

    try {
      return JSON.parse(stored) as StoredSession;
    } catch {
      this.clearSession();
      return null;
    }
  }

  getSession(): LoginResponse | null {
    return this.getStoredSession()?.session ?? null;
  }

  getAccessToken(): string | null {
    return this.getSession()?.access_token ?? null;
  }

  getRefreshToken(): string | null {
    return this.getSession()?.refresh_token ?? null;
  }

  isRememberMe(): boolean {
    return this.getStoredSession()?.rememberMe ?? false;
  }

  hasRememberMeExpired(): boolean {
    const stored = this.getStoredSession();

    if (!stored?.rememberMe || !stored.rememberMeExpiresAt) {
      return false;
    }

    return Date.now() >= stored.rememberMeExpiresAt;
  }

  updateSession(session: LoginResponse): void {
    const stored = this.getStoredSession();
    if (!stored) {
      return;
    }

    const updatedSession: StoredSession = {
      ...stored,
      session,
    };


    const storage = stored.rememberMe ? localStorage : sessionStorage;

    storage.setItem(this.sessionKey, JSON.stringify(updatedSession));
  }

  clearSession(): void {
    localStorage.removeItem(this.sessionKey);
    sessionStorage.removeItem(this.sessionKey);
  }

  hasSession(): boolean {
    return this.getSession() !== null;
  }
}
