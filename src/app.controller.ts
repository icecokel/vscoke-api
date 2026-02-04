import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * 애플리케이션의 루트 컨트롤러
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * 기본적인 Hello World 메시지를 반환함
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
