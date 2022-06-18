import {
  CallHandler,
  ConflictException,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { catchError, Observable, throwError } from 'rxjs';
import { PrismaError } from 'prisma-error-enum';

@Injectable()
export class PrismaExceptionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((e) => {
        if (
          e instanceof PrismaClientKnownRequestError &&
          e.code === PrismaError.UniqueConstraintViolation
        ) {
          return throwError(
            () =>
              new ConflictException({
                message: 'Resource already exists, please verify your inputs.',
              }),
          );
        }
        if (
          e instanceof PrismaClientKnownRequestError &&
          e.code === PrismaError.RecordsNotFound
        ) {
          return throwError(
            () =>
              new NotFoundException({
                message: 'Resource not found, please verify your inputs.',
              }),
          );
        }
        return throwError(() => e);
      }),
    );
  }
}
