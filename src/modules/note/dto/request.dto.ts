import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateNoteDto {
  @ApiProperty({ example: 'Plan dinner' })
  @IsString()
  @IsNotEmpty()
  title: string

  @ApiPropertyOptional({ example: 'Pick a place by Friday' })
  @IsOptional()
  @IsString()
  content?: string
}

export class UpdateNoteDto {
  @ApiPropertyOptional({ example: 'Plan weekend dinner' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string

  @ApiPropertyOptional({ example: 'Reservation at 7pm' })
  @IsOptional()
  @IsString()
  content?: string
}
