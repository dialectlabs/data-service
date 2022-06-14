import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { Logger } from 'nestjs-pino';
import { PrismaExceptionInterceptor } from './middleware/prisma-error-interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'warn', 'error'],
  });
  const logger = app.get(Logger);
  app.useLogger(logger);
  console.log = (it) => logger.log(it);
  console.error = (it) => logger.error(it);
  // TODO: restrict with User-Agent, etc to be sure only our widget is targeting API
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,POST,DELETE',
  });
  app.useGlobalPipes(new ValidationPipe());
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.useGlobalInterceptors(new PrismaExceptionInterceptor());

  const prismaService = app.get(PrismaService);
  prismaService.enableShutdownHooks(app);

  configureSwagger(app);

  await app.listen(process.env.PORT || 8080);
}

function configureSwagger(app: INestApplication) {
  if (process.env.ENVIRONMENT !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Dialect Data Service')
      .setDescription('Dialect Data Service')
      .setVersion('0.1')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('/', app, document);
  }
}

bootstrap();
