import { ApiProperty } from '@nestjs/swagger';

export class ApiSuccessEnvelopeDto {
  @ApiProperty({ example: false })
  error: boolean;

  @ApiProperty({ example: 'success' })
  code: string;

  @ApiProperty({ example: 'Success' })
  message: string;

  @ApiProperty({ nullable: true })
  data: unknown;
}

export class ApiErrorEnvelopeDto {
  @ApiProperty({ example: true })
  error: boolean;

  @ApiProperty({ example: 'error-user-not-found' })
  code: string;

  @ApiProperty({ example: 'User not found' })
  message: string;

  @ApiProperty({ nullable: true })
  data: unknown;
}
