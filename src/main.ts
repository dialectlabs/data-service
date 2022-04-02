import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  app.useGlobalPipes(new ValidationPipe());
  app.enableVersioning({
    type: VersioningType.URI,
  });
  const prismaService = app.get(PrismaService);
  prismaService.enableShutdownHooks(app);

  configureSwagger(app);

  await app.listen(process.env.PORT || 8080);
}

function configureSwagger(app: INestApplication) {
  if (process.env.ENVIRONMENT !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Wallet address registry service')
      .setDescription('Monitoring service API description')
      .setVersion('0.1')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('/', app, document);
  }
}

bootstrap();
