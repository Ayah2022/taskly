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

    // 1. No stored session at all.
    if (!session) {
      return false;
    }

    // 2. The ENTIRE 30-day login period expired.
    // if rememberme expired(true) clear session, return false
    if (this.storage.hasRememberMeExpired()) {
      this.storage.clearSession();
      return false;
    }

    // 3. The overall login period is still valid.
    // Access token is still valid.
    //returned early (true) if the token was NOT expired.

    if (!this.isTokenExpired(session.expires_at)) {
      return true;
    }

    // 4. Access token expired.
    // returned early if isRememberMe() was false.
    //token expired + not remember-me → clear session, return false
    if (!this.storage.isRememberMe()) {
      this.storage.clearSession();
      return false;
    }

    // 5. Remember Me is active and the 30-day period has not expired,
    //  access  token expired, so refresh the access token.
    return this.tokenService.refreshToken();
  }

  logout(): void {
    this.storage.clearSession();
  }

  private isTokenExpired(expiresAt: number): boolean {
    return Date.now() >= expiresAt * 1000;
  }
}
