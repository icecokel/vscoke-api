import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOrigins = process.env.CORS_ORIGINS?.split(',') || [];

  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : false,
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('VSCoke API')
    .setDescription('VSCoke API 문서입니다.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  /* Global Filters & Interceptors */
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Prevent Swagger caching
  const noCache = (req: Request, res: Response, next: NextFunction) => {
    res.header(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate',
    );
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    next();
  };
  app.use('/api', noCache);
  app.use('/api-json', noCache);

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
