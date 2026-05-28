import { ApiProperty } from '@nestjs/swagger';
import { UserSummaryDto } from '../../users/dtos/response.dto';

export class CoupleDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ isArray: true, type: () => UserSummaryDto })
  users: UserSummaryDto[];

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}
