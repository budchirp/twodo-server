import { CoupleMember } from '@/modules/couple/entity/couple-member.entity'
import { ApiException } from '@/core/exception/api.exception'
import type { User } from '@/modules/user/entity/user.entity'
import { Couple } from '@/modules/couple/entity/couple.entity'
import type { CoupleDto } from '@/modules/couple/dto/response.dto'
import { CoupleMapper } from '@/modules/couple/couple.mapper'
import { InjectRepository } from '@nestjs/typeorm'
import { HttpStatus, Injectable } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'

@Injectable()
export class CoupleService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(CoupleMember)
    private readonly members: Repository<CoupleMember>
  ) {}

  async getCurrentCouple(user: User | null): Promise<CoupleDto | null> {
    if (!user) throw new ApiException('error.user_not_found', HttpStatus.NOT_FOUND)

    const membership = await this.members.findOne({
      where: { userId: user.id },
      relations: { couple: { members: { user: true } } }
    })

    return membership ? CoupleMapper.toCoupleResponse(membership.couple) : null
  }

  async leaveCouple(user: User | null): Promise<null> {
    if (!user) throw new ApiException('error.user_not_found', HttpStatus.NOT_FOUND)

    try {
      await this.dataSource.transaction(async (manager) => {
        const membership = await manager.findOne(CoupleMember, { where: { userId: user.id } })
        if (!membership) return

        const coupleId = membership.coupleId
        await manager.remove(CoupleMember, membership)

        if ((await manager.count(CoupleMember, { where: { coupleId } })) === 0) {
          await manager.delete(Couple, { id: coupleId })
        }
      })
    } catch {
      throw new ApiException('error.leave_couple_failed', HttpStatus.INTERNAL_SERVER_ERROR)
    }

    return null
  }
}
