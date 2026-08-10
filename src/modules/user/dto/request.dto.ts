import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator'
import { UserGender } from '@/modules/user/entity/user.entity'
import { ApiProperty } from '@nestjs/swagger'

export class UpdateUserProfileDto {
  @ApiProperty({ example: 'Alex' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string

  @ApiProperty({ enum: UserGender })
  @IsEnum(UserGender)
  gender: UserGender
}
