import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';

import { StorageService } from '../services/storage.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storageService = inject(StorageService);

  const isLoginRequest = req.url.includes('/auth/v1/token');
  const isSignupRequest = req.url.includes('/auth/v1/signup');
  const isRecoverRequest = req.url.includes('/auth/v1/recover');

  const isPublicAuthRequest = isLoginRequest || isSignupRequest || isRecoverRequest;

  // Requests that happen before authentication
  if (isPublicAuthRequest) {
    return next(
      req.clone({
        setHeaders: {
          apikey: environment.apiKey,
        },
      }),
    );
  }

  const token = storageService.getAccessToken();

  // Don't overwrite an Authorization header explicitly
  // provided by the request, e.g. password reset.
  if (req.headers.has('Authorization')) {
    return next(
      req.clone({
        setHeaders: {
          apikey: environment.apiKey,
        },
      }),
    );
  }

  if (!token) {
    return next(
      req.clone({
        setHeaders: {
          apikey: environment.apiKey,
        },
      }),
    );
  }

  return next(
    req.clone({
      setHeaders: {
        apikey: environment.apiKey,
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};
