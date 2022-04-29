import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

const basicHeader = 'Basic ';

const THE_ONLY_BASIC_AUTH_USER = process.env.BASIC_AUTH_USER;

@Injectable()
export class BasicAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('No Authorization header');
    }
    if (!authHeader.startsWith(basicHeader)) {
      throw new UnauthorizedException('Invalid authorization header');
    }
    const headerElements = authHeader.split(' ');
    if (headerElements.length != 2) {
      throw new UnauthorizedException('Invalid authorization header');
    }
    const b64auth = headerElements[1];
    const [username] = Buffer.from(b64auth, 'base64').toString().split(':');

    this.authenticate(username);

    return true;
  }

  private authenticate(username?: string) {
    if (!username || !THE_ONLY_BASIC_AUTH_USER) {
      throw new UnauthorizedException();
    }

    if (username !== `Basic ${THE_ONLY_BASIC_AUTH_USER}`) {
      throw new UnauthorizedException();
    }
  }
}
