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

    // No stored session.
    if (!session) {
      return false;
    }

    // Remember-me period has ended.
    if (this.storage.hasRememberMeExpired()) {
      this.storage.clearSession();
      return false;
    }

    // Access token is still valid.
    if (!this.isTokenExpired(session.expires_at)) {
      return true;
    }

    // Access token expired.
    // Try to get a new access token using the refresh token.
    return this.tokenService.refreshToken();
  }

  logout(): void {
    this.storage.clearSession();
  }

  private isTokenExpired(expiresAt: number): boolean {
    return Date.now() >= expiresAt * 1000;
  }
}
