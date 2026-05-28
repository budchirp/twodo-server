import { ApiProperty } from '@nestjs/swagger';
import { UserGender } from '../entities/user.entity';

export class UserSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true, type: String })
  picture: string | null;

  @ApiProperty({ enum: UserGender, nullable: true })
  gender: UserGender | null;
}

export class UserCoupleDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ isArray: true, type: () => UserSummaryDto })
  users: UserSummaryDto[];

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}

export class UserDto extends UserSummaryDto {
  @ApiProperty()
  profileCompleted: boolean;

  @ApiProperty({ nullable: true, type: () => UserCoupleDto })
  couple: UserCoupleDto | null;
}
