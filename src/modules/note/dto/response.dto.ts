import { ApiProperty } from '@nestjs/swagger'

export class NoteDto {
  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty()
  title: string

  @ApiProperty()
  content: string

  @ApiProperty({ format: 'date-time' })
  createdAt: string

  @ApiProperty({ format: 'date-time' })
  updatedAt: string
}
