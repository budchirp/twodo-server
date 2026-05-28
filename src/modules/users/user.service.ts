import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiException } from '../../core/exceptions/api.exception';
import { ExternalAuthUser } from '../../core/auth/auth.types';
import { CoupleMember } from '../couples/entities/couple-member.entity';
import { UpdateUserProfileDto } from './dtos/request.dto';
import { UserDto } from './dtos/response.dto';
import { User } from './entities/user.entity';
import { UserMapper } from './user.mapper';
import { isUserGender } from './user-profile.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(CoupleMember)
    private readonly members: Repository<CoupleMember>,
  ) {}

  async initialize(externalUser: ExternalAuthUser): Promise<UserDto> {
    const name = externalUser.profile.name?.trim() || externalUser.username;
    const user = this.users.create({
      id: externalUser.id,
      username: externalUser.username,
      name,
      picture: externalUser.profile.picture ?? null,
      gender: isUserGender(externalUser.profile.gender)
        ? externalUser.profile.gender
        : null,
    });

    try {
      await this.users.save(user);
    } catch {
      throw new ApiException(
        'error.user_init_failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const savedUser = await this.users.findOneOrFail({
      where: { id: externalUser.id },
    });

    return this.getCurrentUser(savedUser);
  }

  async getCurrentUser(user: User | null): Promise<UserDto> {
    if (!user) {
      throw new ApiException('error.user_not_found', HttpStatus.NOT_FOUND);
    }

    const membership = await this.members.findOne({
      where: { userId: user.id },
      relations: { couple: { members: { user: true } } },
    });

    return UserMapper.toUserResponse(user, membership?.couple ?? null);
  }

  async updateCurrentUserProfile(
    user: User | null,
    body: UpdateUserProfileDto,
  ): Promise<UserDto> {
    if (!user) {
      throw new ApiException('error.user_not_found', HttpStatus.NOT_FOUND);
    }

    const name = body.name.trim();
    if (name === '') {
      throw new ApiException('error.invalid_profile_data', HttpStatus.BAD_REQUEST);
    }

    if (!isUserGender(body.gender)) {
      throw new ApiException('error.invalid_gender', HttpStatus.BAD_REQUEST);
    }

    user.name = name;
    user.gender = body.gender;

    return this.getCurrentUser(await this.users.save(user));
  }
}
