import { inject, Injectable } from '@angular/core';

import { StorageService } from './storage.service';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly storage = inject(StorageService);
  private readonly tokenService = inject(TokenService);

  isAuthenticated(): boolean {
    return this.storage.hasSession();
  }

  async restoreSession(): Promise<boolean> {
    const session = this.storage.getSession();

    if (!session) {
      return false;
    }

    if (this.storage.hasRememberMeExpired()) {
      this.storage.clearSession();
      return false;
    }
    // Access token is still valid.
    if (!this.isTokenExpired(session.expires_at)) {
      return true;
    }

    // Access token expired.
    // Only a remembered session should be restored.
    if (!this.storage.isRememberMe()) {
      this.storage.clearSession();
      return false;
    }

    return this.tokenService.refreshToken();
  }

  logout(): void {
    this.storage.clearSession();
  }

  private isTokenExpired(expiresAt: number): boolean {
    return Date.now() >= expiresAt * 1000;
  }
}
