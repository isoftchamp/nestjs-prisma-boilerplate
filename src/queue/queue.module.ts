import { BullModule } from '@nestjs/bullmq';
import { DynamicModule, Module } from '@nestjs/common';

import { ConfigurableModuleClass, OPTIONS_TYPE } from './queue.module-definition.js';

@Module({})
export class QueueModule extends ConfigurableModuleClass {
  static register(options: typeof OPTIONS_TYPE): DynamicModule {
    const bullModules = options.queues.map((name) => BullModule.registerQueue({ name }));

    const flowProducers = (options.flows || []).map((name) =>
      BullModule.registerFlowProducer({
        name,
      }),
    );

    return {
      ...super.register(options),
      imports: [...bullModules, ...flowProducers],
      exports: [...bullModules, ...flowProducers],
    };
  }
}
