import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const { method } = req;
    const url =
      req.originalUrl?.toString() || req.url?.toString() || req.baseUrl || '';
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - start;
        const status = res.statusCode;
        const requestId =
          (req.headers['x-request-id'] as string | undefined) ??
          (req.headers['x-requestid'] as string | undefined);

        console.info(
          '[Request]',
          JSON.stringify({
            method,
            url,
            status,
            durationMs: ms,
            requestId: requestId?.toString(),
          }),
        );
      }),
    );
  }
}
