import { isUserProfileCompleted } from '@/modules/user/util/user-profile.util'
import type { UserDto, UserSummaryDto } from '@/modules/user/dto/response.dto'
import type { Couple } from '@/modules/couple/entity/couple.entity'
import type { User } from '@/modules/user/entity/user.entity'

export class UserMapper {
  static toUserSummary(user: User): UserSummaryDto {
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      picture: user.picture,
      gender: user.gender
    }
  }

  static toUserResponse(user: User, couple: Couple | null): UserDto {
    return {
      ...UserMapper.toUserSummary(user),
      profileCompleted: isUserProfileCompleted(user),
      couple: couple
        ? {
            id: couple.id,
            users: couple.members.map((member) => UserMapper.toUserSummary(member.user)),
            createdAt: couple.createdAt.toISOString(),
            updatedAt: couple.updatedAt.toISOString()
          }
        : null
    }
  }
}
