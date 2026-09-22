import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';

import { StorageService } from '../services/storage.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storageService = inject(StorageService);

  const isRefreshRequest = req.url.includes('/auth/v1/token');
  //No old access token gets added to the refresh request.
  if (isRefreshRequest) {
    return next(req);
  }

  const token = storageService.getAccessToken();

  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};
