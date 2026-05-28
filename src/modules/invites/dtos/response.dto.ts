import { ApiProperty } from '@nestjs/swagger';
import { UserSummaryDto } from '../../users/dtos/response.dto';
import { InviteStatus } from '../entities/invite.entity';

export class InviteDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ type: () => UserSummaryDto })
  user: UserSummaryDto;

  @ApiProperty({ enum: ['sent', 'received'] })
  type: 'sent' | 'received';

  @ApiProperty({ enum: InviteStatus })
  status: InviteStatus;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}
