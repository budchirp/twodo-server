import { UserSummaryDto } from '@/modules/user/dto/response.dto'
import { ApiProperty } from '@nestjs/swagger'

export class CoupleDto {
  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty({ isArray: true, type: () => UserSummaryDto })
  users: UserSummaryDto[]

  @ApiProperty({ format: 'date-time' })
  createdAt: string

  @ApiProperty({ format: 'date-time' })
  updatedAt: string
}
