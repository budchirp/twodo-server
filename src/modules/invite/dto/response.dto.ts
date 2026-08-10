import { InviteStatus } from '@/modules/invite/entity/invite.entity'
import { UserSummaryDto } from '@/modules/user/dto/response.dto'
import { ApiProperty } from '@nestjs/swagger'

export class InviteDto {
  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty({ type: () => UserSummaryDto })
  user: UserSummaryDto

  @ApiProperty({ enum: ['sent', 'received'] })
  type: 'sent' | 'received'

  @ApiProperty({ enum: InviteStatus })
  status: InviteStatus

  @ApiProperty({ format: 'date-time' })
  createdAt: string

  @ApiProperty({ format: 'date-time' })
  updatedAt: string
}
