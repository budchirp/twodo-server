import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateInviteDto {
  @ApiProperty({ example: 'partner' })
  @IsString()
  @IsNotEmpty()
  username: string;
}

export enum InviteAction {
  Accept = 'accept',
  Reject = 'reject',
}

export class HandleInviteDto {
  @ApiProperty({ enum: InviteAction })
  @IsEnum(InviteAction)
  action: InviteAction;
}
