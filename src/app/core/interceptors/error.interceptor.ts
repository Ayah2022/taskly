import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { StorageService } from '../services/storage.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const storageService = inject(StorageService);

  const isPublicAuthRequest =
    req.url.includes('/auth/v1/token') ||
    req.url.includes('/auth/v1/signup') ||
    req.url.includes('/auth/v1/recover');

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('API Error:', {
        url: req.url,
        status: error.status,
        message: error.message,
        error: error.error,
      });

      switch (error.status) {
        case 400:
          console.error('Bad request');
          break;

        case 401:
          console.error('Unauthorized');

          // Don't redirect for invalid login/signup/recovery requests.
          if (!isPublicAuthRequest) {
            storageService.clearSession();

            if (router.url !== '/login') {
              void router.navigateByUrl('/login', {
                replaceUrl: true,
              });
            }
          }
          break;

        case 403:
          console.error('Forbidden');
          break;

        case 404:
          console.error('Resource not found');
          break;

        case 500:
        case 502:
        case 503:
          console.error('Server error');
          break;

        default:
          console.error('Unexpected error');
      }

      return throwError(() => error);
    }),
  );
};
