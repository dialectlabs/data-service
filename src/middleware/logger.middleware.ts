import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggerMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    if (process.env.ENVIRONMENT && process.env.ENVIRONMENT !== 'production') {
      this.logger.log(`${req.method} to ${req.url}: ${req.params}`);
    }
    next();
  }
}
