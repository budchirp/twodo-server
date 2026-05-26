import { Controller, Get } from '@nestjs/common';

@Controller('server')
export class ServerController {
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
    };
  }

  @Get('version')
  getVersion() {
    return {
      version: 'v0.1.0',
    };
  }
}
