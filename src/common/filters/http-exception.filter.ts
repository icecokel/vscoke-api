import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorMessage } from '../constants/message.constant';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : ErrorMessage.COMMON.INTERNAL_SERVER_ERROR;

    // HttpException의 getResponse()가 객체일 경우(예: validation pipe) 처리
    const errorMessage =
      typeof message === 'object' && message !== null && 'message' in message
        ? (message as any).message
        : message;

    response.status(status).json({
      success: false,
      statusCode: status,
      message: errorMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
