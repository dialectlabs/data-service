import {
  CallHandler,
  ConflictException,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { catchError, Observable, throwError } from 'rxjs';
import { PrismaError } from 'prisma-error-enum';

@Injectable()
export class PrismaExceptionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((e) => {
        console.log(JSON.stringify(e, null, 2));
        if (
          e instanceof PrismaClientKnownRequestError &&
          e.code === PrismaError.UniqueConstraintViolation
        ) {
          const err = e as PrismaClientKnownRequestError & {
            meta?: { target?: string[] };
          };
          return throwError(
            () =>
              new ConflictException(
                `Resource already exists or unique constraint violation happened, please verify your inputs: [${(
                  err?.meta?.target ?? []
                ).join(', ')}].`,
              ),
          );
        }
        if (
          e instanceof PrismaClientKnownRequestError &&
          e.code === PrismaError.RecordsNotFound
        ) {
          const err = e as PrismaClientKnownRequestError & {
            meta?: { cause?: string };
          };
          return throwError(
            () =>
              new UnprocessableEntityException(
                err?.meta?.cause ??
                  'Request failed due to business rule or data model violation, please verify your inputs.',
              ),
          );
        }
        return throwError(() => e);
      }),
    );
  }
}
