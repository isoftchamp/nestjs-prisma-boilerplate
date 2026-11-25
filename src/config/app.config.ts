import * as os from 'node:os';
import * as path from 'node:path';

import { AppEnvironment, type Environment } from './environment.js';

export const createAppConfig = (environment: Environment) => ({
  name: environment.APP_NAME,
  environment: environment.APP_ENV,
  isDevelopment: environment.APP_ENV === AppEnvironment.Development,
  isProduction: environment.APP_ENV === AppEnvironment.Production,
  isStaging: environment.APP_ENV === AppEnvironment.Staging,
  isTest: environment.APP_ENV === AppEnvironment.Test,
  apiPort: environment.APP_PORT,
  workerPort: environment.WORKER_PORT,
  allowedCors:
    environment.ALLOWED_CORS?.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean) ?? [],
  bodySize: environment.BODY_SIZE,
  uploadPath: path.join(os.tmpdir(), environment.UPLOAD_FOLDER),
});
