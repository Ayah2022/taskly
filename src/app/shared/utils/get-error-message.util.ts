// shared/utils/get-error-message.util.ts
import { HttpErrorResponse } from '@angular/common/http';

export function getErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Try again later.',
): string {
  if (error instanceof HttpErrorResponse) {
    const apiError = error.error;

    if (typeof apiError === 'string') return apiError;
    if (apiError?.message) return apiError.message;
    if (apiError?.error) return apiError.error;

    return error.message || fallback;
  }

  if (error instanceof Error) return error.message;

  return fallback;
}
