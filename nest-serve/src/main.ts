// 启动文件，它是整个应用的入口
//NestFactory，这是Nest提供的一个用于创建应用实例的工厂类。
import { NestFactory } from '@nestjs/core';
//根模块AppModule，这是Nest应用的起点，所有功能模块会被注册到这个模块中
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionFilter } from '../utils/all-exception.filter';
import { TransformInterceptor } from '../utils/transform.interceptor';
import { MyLogger } from '../utils/no-timestamp-logger';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new MyLogger(),
  });
  // 访问静态资源：文档
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));
  // 访问图片
  app.use('/open-image', express.static(join(process.cwd(), 'uploads-image')));
  //给所有接口后面加上一个自定义的api
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, //自动去掉没有定义的字段
      forbidNonWhitelisted: true, //如果有多余的字段抛出错误
    }),
  );
  // 注册全局异常过滤器
  app.useGlobalFilters(new AllExceptionFilter());
  // 注册全局响应拦截器
  app.useGlobalInterceptors(new TransformInterceptor());
  // 允许跨域
  app.enableCors({
    origin: '*',
  });
  await app.listen(7005);
}
bootstrap();
