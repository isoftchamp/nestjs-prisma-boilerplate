import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { InternalUrl, ResponseMessage } from '../../shared/enums/index.js';

@Controller(InternalUrl.HEALTH_CHECK)
@ApiTags('Public')
export class HealthcheckController {
  @Get()
  index() {
    return {
      message: ResponseMessage.OK,
    };
  }
}
