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
    return this.storage.hasAccessToken();
  }

  async restoreSession(): Promise<boolean> {
    const session = this.storage.getSession();

    if (!session) {
      return false;
    }

    // Has the 30-day Remember Me period ended?
    if (this.storage.hasRememberMeExpired()) {
      this.storage.clearSession();
      return false;
    }

    // Is the current access token still valid?
    if (!this.isTokenExpired(session.access_token)) {
      return true;
    }

    // Access token expired, but Remember Me is still valid.
    // Now refresh it.
    return await this.tokenService.refreshToken();
  }

  logout(): void {
    this.storage.clearSession();
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }
}
