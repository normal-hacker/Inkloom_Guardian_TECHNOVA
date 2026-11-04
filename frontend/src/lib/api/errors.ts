import { NextResponse } from 'next/server';

export type ApiErrorCode =
  | 'bad_request'
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'validation_error'
  | 'internal_error';

export type ApiErrorBody = {
  error: {
    code: ApiErrorCode;
    message: string;
    details: Record<string, unknown>;
    request_id: string;
  };
};

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  requestId: string,
  details: Record<string, unknown> = {},
) {
  const body: ApiErrorBody = {
    error: { code, message, details, request_id: requestId },
  };

  return NextResponse.json(body, {
    status,
    headers: { 'X-Request-ID': requestId },
  });
}
