import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  //globally observing/handling HTTP errors
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
