import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import type { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorTrackingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const path =
      req?.originalUrl?.toString() ||
      req?.url?.toString() ||
      req?.baseUrl?.toString() ||
      '';

    return next.handle().pipe(
      catchError((error: unknown) => {
        const timestamp = new Date().toISOString();

        console.error('[ErrorTracking]', {
          path,
          timestamp,
          error:
            error instanceof Error
              ? {
                  name: error.name,
                  message: error.message,
                  stack: error.stack,
                }
              : String(error),
        });

        throw error;
      }),
    );
  }
}
