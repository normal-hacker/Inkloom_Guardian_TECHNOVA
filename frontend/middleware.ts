import { NextRequest, NextResponse } from 'next/server';

const requestIdPattern = /^[A-Za-z0-9._:-]{1,128}$/;

export function middleware(request: NextRequest) {
  const suppliedId = request.headers.get('x-request-id');
  const requestId =
    suppliedId && requestIdPattern.test(suppliedId)
      ? suppliedId
      : crypto.randomUUID();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set('X-Request-ID', requestId);
  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
