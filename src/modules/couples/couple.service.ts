import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ApiException } from '../../core/exceptions/api.exception';
import { User } from '../users/entities/user.entity';
import { CoupleDto } from './dtos/response.dto';
import { Couple } from './entities/couple.entity';
import { CoupleMember } from './entities/couple-member.entity';
import { CoupleMapper } from './couple.mapper';

@Injectable()
export class CouplesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(CoupleMember)
    private readonly members: Repository<CoupleMember>,
  ) {}

  async getCurrentCouple(user: User | null): Promise<CoupleDto | null> {
    if (!user) {
      throw new ApiException('error.user_not_found', HttpStatus.NOT_FOUND);
    }

    const membership = await this.members.findOne({
      where: { userId: user.id },
      relations: { couple: { members: { user: true } } },
    });

    return membership
      ? CoupleMapper.toCoupleResponse(membership.couple)
      : null;
  }

  async leaveCouple(user: User | null) {
    if (!user) {
      throw new ApiException('error.user_not_found', HttpStatus.NOT_FOUND);
    }

    try {
      await this.dataSource.transaction(async (manager) => {
        const membership = await manager.findOne(CoupleMember, {
          where: { userId: user.id },
        });

        if (!membership) {
          return;
        }

        const coupleId = membership.coupleId;
        await manager.remove(CoupleMember, membership);

        const remainingMembers = await manager.count(CoupleMember, {
          where: { coupleId },
        });

        if (remainingMembers === 0) {
          await manager.delete(Couple, { id: coupleId });
        }
      });
    } catch {
      throw new ApiException(
        'error.leave_couple_failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return null;
  }
}
