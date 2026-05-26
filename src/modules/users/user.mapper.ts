import { Couple } from '../couples/entities/couple.entity';
import { UserDto, UserSummaryDto } from './dtos/response.dto';
import { User } from './entities/user.entity';

export class UserMapper {
  static toUserSummary(user: User): UserSummaryDto {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      pictureUrl: user.pictureUrl,
      gender: user.gender,
    };
  }

  static toUserResponse(user: User, couple: Couple | null): UserDto {
    return {
      ...UserMapper.toUserSummary(user),
      couple: couple
        ? {
            id: couple.id,
            users: couple.members.map((member) =>
              UserMapper.toUserSummary(member.user),
            ),
            createdAt: couple.createdAt.toISOString(),
            updatedAt: couple.updatedAt.toISOString(),
          }
        : null,
    };
  }
}
