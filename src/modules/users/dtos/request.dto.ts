import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { UserGender } from '../entities/user.entity';

export class UpdateUserProfileDto {
  @ApiProperty({ example: 'Alex' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ enum: UserGender })
  @IsEnum(UserGender)
  gender: UserGender;
}
