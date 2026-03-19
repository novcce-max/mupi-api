import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

export interface ErrorResponseBody {
  ok: false;
  code: number; // 业务错误码，默认等于 httpStatus
  httpStatus: number;
  message: string;
  path: string;
  timestamp: string;
  requestId?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const path = req.url || req.path;
    const timestamp = new Date().toISOString();
    const requestIdHeader =
      (req?.headers['x-request-id'] as string | undefined) ??
      (req?.headers['x-requestid'] as string | undefined);
    const requestId = requestIdHeader?.toString();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let businessCode = status;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const rawMessage =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : ((exceptionResponse as { message?: string | string[] })?.message ??
            exception.message);
      message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;

      // 支持从 HttpException 响应体中透传业务错误码：throw new BadRequestException({ message, code: 10001 })
      if (
        exceptionResponse &&
        typeof exceptionResponse === 'object' &&
        'code' in (exceptionResponse as Record<string, unknown>)
      ) {
        const rawCode = (exceptionResponse as { code?: number | string }).code;
        const parsed =
          typeof rawCode === 'string' ? Number.parseInt(rawCode, 10) : rawCode;
        if (typeof parsed === 'number' && Number.isFinite(parsed)) {
          businessCode = parsed;
        }
      } else {
        businessCode = status;
      }

      this.logger.warn(
        `HttpException ${status} (code=${businessCode}) ${path}: ${message}`,
      );
    } else {
      this.logger.error(
        `Unhandled exception ${path}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ErrorResponseBody = {
      ok: false,
      code: businessCode,
      httpStatus: status,
      message,
      path,
      timestamp,
    };

    if (requestId) {
      body.requestId = requestId;
    }

    res.status(status).json(body);
  }
}
