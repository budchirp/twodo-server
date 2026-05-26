import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateInviteDto {
  @IsString()
  @IsNotEmpty()
  username: string;
}

export enum InviteAction {
  Accept = 'accept',
  Reject = 'reject',
}

export class HandleInviteDto {
  @IsEnum(InviteAction)
  action: InviteAction;
}
