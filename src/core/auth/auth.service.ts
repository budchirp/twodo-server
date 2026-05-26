import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { ApiException } from '../exceptions/api.exception';
import type { AuthContext, ExternalAuthUser } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async authenticate(authorization?: string): Promise<AuthContext> {
    if (!authorization?.startsWith('Bearer ')) {
      throw new ApiException('error.unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const externalUser = await this.fetchExternalUser(authorization);
    const user = await this.users.findOne({ where: { id: externalUser.id } });

    return { externalUser, user };
  }

  private async fetchExternalUser(authorization: string): Promise<ExternalAuthUser> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.config.getOrThrow<number>('AUTH_TIMEOUT_MS'),
    );

    let response: Response;
    try {
      response = await fetch(
        `${this.config.getOrThrow<string>('AUTH_API_URL')}/user`,
        {
          headers: { Authorization: authorization },
          signal: controller.signal,
        },
      );
    } catch {
      throw new ApiException(
        'error.auth_server_unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new ApiException('error.unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const body = (await response.json().catch(() => null)) as unknown;
    if (!this.isExternalAuthResponse(body)) {
      throw new ApiException(
        'error.auth_server_error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return {
      id: body.data.id,
      username: body.data.username,
      profile: {
        name: body.data.profile?.name ?? null,
        picture: body.data.profile?.picture ?? null,
        gender: body.data.profile?.gender ?? null,
      },
    };
  }

  private isExternalAuthResponse(body: unknown): body is {
    data: ExternalAuthUser;
  } {
    if (!body || typeof body !== 'object' || !('data' in body)) {
      return false;
    }

    const data = (body as { data: unknown }).data;
    if (!data || typeof data !== 'object') {
      return false;
    }

    const authUser = data as Partial<ExternalAuthUser>;
    return typeof authUser.id === 'string' && typeof authUser.username === 'string';
  }
}
