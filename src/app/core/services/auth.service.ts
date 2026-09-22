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
    console.log('ACCESS TOKEN EXPIRES:', new Date(session.expires_at * 1000));

    console.log('NOW:', new Date());

    // 2. The ENTIRE 30-day login period expired.
    // We are done with this session.
    // Remember-me period has ended.
    if (this.storage.hasRememberMeExpired()) {
      this.storage.clearSession();
      return false;
    }

    // 3. The overall login period is still valid.
    // Check the CURRENT access token.
    // Access token is still valid.
    if (!this.isTokenExpired(session.expires_at)) {
      return true;
    }

    // 4. Access token expired.
    //    Decide whether we are allowed to refresh it.
    if (!this.storage.isRememberMe()) {
      this.storage.clearSession();
      return false;
    }

    // 5. Remember Me is active and the 30-day period
    //    has not expired, so refresh the access token.
    return this.tokenService.refreshToken();
  }

  logout(): void {
    this.storage.clearSession();
  }

  private isTokenExpired(expiresAt: number): boolean {
    return Date.now() >= expiresAt * 1000;
  }
}
