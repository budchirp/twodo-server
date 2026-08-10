import type { Couple } from '@/modules/couple/entity/couple.entity'
import type { CoupleDto } from '@/modules/couple/dto/response.dto'
import { UserMapper } from '@/modules/user/user.mapper'

export class CoupleMapper {
  static toCoupleResponse(couple: Couple): CoupleDto {
    return {
      id: couple.id,
      users: couple.members.map((member) => UserMapper.toUserSummary(member.user)),
      createdAt: couple.createdAt.toISOString(),
      updatedAt: couple.updatedAt.toISOString()
    }
  }
}
