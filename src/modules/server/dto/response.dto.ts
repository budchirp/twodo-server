import { ApiProperty } from '@nestjs/swagger'

export class HealthDto {
  @ApiProperty({ example: 'ok' })
  status: string
}

export class VersionDto {
  @ApiProperty({ example: 'v0.1.0' })
  version: string
}
