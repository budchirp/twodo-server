import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSuccessResponse } from '../../core/openapi/api-success-response.decorator';
import { HealthDto, VersionDto } from './dtos/response.dto';

@Controller('server')
@ApiTags('server')
export class ServerController {
  @Get('health')
  @ApiSuccessResponse({ type: HealthDto })
  getHealth(): HealthDto {
    return {
      status: 'ok',
    };
  }

  @Get('version')
  @ApiSuccessResponse({ type: VersionDto })
  getVersion(): VersionDto {
    return {
      version: 'v0.1.0',
    };
  }
}
