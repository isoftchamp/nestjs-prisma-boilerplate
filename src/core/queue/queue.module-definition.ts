import { ConfigurableModuleBuilder } from '@nestjs/common';

import { QueueModuleOptions } from './queue.interface.js';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
  new ConfigurableModuleBuilder<QueueModuleOptions>().build();
