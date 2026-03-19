import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiSuccessResponse<T = unknown> {
  ok: true;
  data: T;
}

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const requestIdHeader =
      (req?.headers['x-request-id'] as string | undefined) ??
      (req?.headers['x-requestid'] as string | undefined);

    const requestId = requestIdHeader?.toString();

    return next.handle().pipe(
      map((data: unknown) => {
        if (
          data &&
          typeof data === 'object' &&
          'ok' in (data as Record<string, unknown>) &&
          (data as Record<string, unknown>).ok === true &&
          !('data' in (data as Record<string, unknown>))
        ) {
          return data;
        }

        if (
          data &&
          typeof data === 'object' &&
          'ok' in (data as Record<string, unknown>) &&
          'data' in (data as Record<string, unknown>)
        ) {
          return data;
        }

        const response: ApiSuccessResponse<unknown> = { ok: true, data };
        return requestId
          ? { ...response, requestId }
          : response;
      }),
    );
  }
}
