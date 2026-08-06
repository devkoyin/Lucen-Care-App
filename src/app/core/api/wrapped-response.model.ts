/**
 * The backend's TransformInterceptor wraps every successful response in this
 * envelope. Errors are NOT wrapped — they come back as an RFC 7807 Problem
 * Detail at the top level (see ApiErrorBody).
 */
export interface WrappedResponse<T> {
  data: T;
  meta?: { total?: number; cursor?: string; limit?: number };
  traceId: string;
}

/** Shape of `HttpErrorResponse.error` from this API. */
export interface ApiErrorBody {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  message?: string;
  traceId?: string;
  /** Present on 422 responses from the global ValidationPipe. */
  errors?: Array<{ path: string; message: string }>;
}

/**
 * Extracts the most specific message from an API error, preferring the first
 * field-level validation error over the generic one.
 */
export function apiErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const body = (err as { error?: ApiErrorBody } | undefined)?.error;
  return body?.errors?.[0]?.message ?? body?.message ?? body?.detail ?? fallback;
}
