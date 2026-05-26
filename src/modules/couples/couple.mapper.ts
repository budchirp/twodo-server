import { UserMapper } from '../users/user.mapper';
import { CoupleDto } from './dtos/response.dto';
import { Couple } from './entities/couple.entity';

export class CoupleMapper {
  static toCoupleResponse(couple: Couple): CoupleDto {
    return {
      id: couple.id,
      users: couple.members.map((member) =>
        UserMapper.toUserSummary(member.user),
      ),
      createdAt: couple.createdAt.toISOString(),
      updatedAt: couple.updatedAt.toISOString(),
    };
  }
}
