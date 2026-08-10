import { IsEnum, IsNotEmpty, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateInviteDto {
  @ApiProperty({ example: 'partner' })
  @IsString()
  @IsNotEmpty()
  username: string
}

export enum InviteAction {
  Accept = 'accept',
  Reject = 'reject'
}

export class HandleInviteDto {
  @ApiProperty({ enum: InviteAction })
  @IsEnum(InviteAction)
  action: InviteAction
}
