import type { ExternalAuthUser } from '@/modules/auth/auth.types'
import { CoupleMember } from '@/modules/couple/entity/couple-member.entity'
import { isUserGender } from '@/modules/user/util/user-profile.util'
import { User, UserGender } from '@/modules/user/entity/user.entity'
import type { UpdateUserProfileDto } from '@/modules/user/dto/request.dto'
import { ApiException } from '@/core/exception/api.exception'
import type { UserDto } from '@/modules/user/dto/response.dto'
import { UserMapper } from '@/modules/user/user.mapper'
import { InjectRepository } from '@nestjs/typeorm'
import { HttpStatus, Injectable } from '@nestjs/common'
import { Repository } from 'typeorm'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(CoupleMember)
    private readonly members: Repository<CoupleMember>
  ) {}

  async initialize(externalUser: ExternalAuthUser): Promise<UserDto> {
    const user = this.users.create({
      id: externalUser.id,
      username: externalUser.username,
      name: externalUser.profile.name?.trim() || externalUser.username,
      picture: externalUser.profile.picture ?? null,
      gender: isUserGender(externalUser.profile.gender) ? externalUser.profile.gender : null
    })

    try {
      await this.users.save(user)
    } catch {
      throw new ApiException('error.user_init_failed', HttpStatus.INTERNAL_SERVER_ERROR)
    }

    return this.getCurrentUser(await this.users.findOneOrFail({ where: { id: externalUser.id } }))
  }

  async getCurrentUser(user: User | null): Promise<UserDto> {
    if (!user) throw new ApiException('error.user_not_found', HttpStatus.NOT_FOUND)

    const membership = await this.members.findOne({
      where: { userId: user.id },
      relations: { couple: { members: { user: true } } }
    })

    return UserMapper.toUserResponse(user, membership?.couple ?? null)
  }

  async updateCurrentUserProfile(user: User | null, body: UpdateUserProfileDto): Promise<UserDto> {
    if (!user) throw new ApiException('error.user_not_found', HttpStatus.NOT_FOUND)
    const name = body.name.trim()
    if (!name) throw new ApiException('error.invalid_profile_data', HttpStatus.BAD_REQUEST)
    if (!isUserGender(body.gender))
      throw new ApiException('error.invalid_gender', HttpStatus.BAD_REQUEST)

    user.name = name
    user.gender = body.gender
    return this.getCurrentUser(await this.users.save(user))
  }
}
