import { ApiSuccessResponse } from '@/core/openapi/api-success-response.decorator'
import { HealthDto, VersionDto } from '@/modules/server/dto/response.dto'
import { Controller, Get } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

@Controller('server')
@ApiTags('server')
export class ServerController {
  @Get('health')
  @ApiSuccessResponse({ type: HealthDto })
  getHealth(): HealthDto {
    return {
      status: 'ok'
    }
  }

  @Get('version')
  @ApiSuccessResponse({ type: VersionDto })
  getVersion(): VersionDto {
    return {
      version: 'v0.1.0'
    }
  }
}
