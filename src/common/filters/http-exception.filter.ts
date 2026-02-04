import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorMessage } from '../constants/message.constant';

/**
 * 전역 예외 필터: 발생하는 모든 예외를 캡처하여 일관된 형식의 응답을 반환함
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  /**
   * 예외 발생 시 호출되는 메서드
   */
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // HTTP 상태 코드 결정
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // 에러 메시지 추출
    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : ErrorMessage.COMMON.INTERNAL_SERVER_ERROR;

    // HttpException의 getResponse()가 객체일 경우(예: validation pipe) 처리
    const errorMessage =
      typeof message === 'object' && message !== null && 'message' in message
        ? (message as any).message
        : message;

    // 로깅 처리 (500번대 에러는 error로, 그 외는 warn으로 기록)
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[${request.method}] ${request.url}`,
        exception instanceof Error
          ? exception.stack
          : JSON.stringify(exception),
      );
    } else {
      this.logger.warn(
        `[${request.method}] ${request.url} - ${status} - ${JSON.stringify(errorMessage)}`,
      );
    }

    // 통일된 JSON 형식으로 에러 응답 반환
    response.status(status).json({
      success: false,
      statusCode: status,
      message: errorMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
