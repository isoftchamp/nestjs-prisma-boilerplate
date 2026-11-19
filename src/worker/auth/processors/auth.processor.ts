import { Processor } from '@nestjs/bullmq';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Job } from 'bullmq';

import { UserDto } from '../../../shared/dtos/index.js';
import { AUTH_JOB, QUEUE } from '../../../shared/enums/index.js';
import { WorkerHostProcessor } from '../../../shared/processors/index.js';

@Processor(QUEUE.AUTH_QUEUE)
@Injectable()
export class AuthProcessor extends WorkerHostProcessor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  process(job: Job<UserDto, number, string>): Promise<any> {
    const { email } = job.data;
    switch (job.name) {
      case AUTH_JOB.SEND_SIGNUP_EMAIL:
        // TODO: mockup background job, update to real logic
        return new Promise((resolve, _reject) => {
          setTimeout(() => {
            job.updateProgress(50);
          }, 5000);
          setTimeout(() => {
            resolve([email, 'registered']);
          }, 10000);
        });
    }
    throw new BadRequestException(`Unknown job name: ${job.name}`);
  }
}
