import { type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { timingSafeEqual } from 'crypto';
import { type NextFunction, type Request, type Response } from 'express';

import { ENV } from './shared/enums/index.js';

function normalizeSwaggerPath(swaggerPath: string): string {
  const normalizedPath = swaggerPath.startsWith('/') ? swaggerPath : `/${swaggerPath}`;

  if (normalizedPath.length > 1 && normalizedPath.endsWith('/')) {
    return normalizedPath.slice(0, -1);
  }

  return normalizedPath;
}

function sendUnauthorized(res: Response) {
  res.setHeader('WWW-Authenticate', 'Basic realm="Swagger Docs"');

  return res.status(401).send('Authentication required');
}

function createSwaggerAuthMiddleware(username: string, password: string) {
  const expectedCredentials = Buffer.from(`${username}:${password}`);

  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Basic ')) {
      return sendUnauthorized(res);
    }

    const providedCredentials = Buffer.from(authHeader.slice(6), 'base64');

    if (
      providedCredentials.length !== expectedCredentials.length ||
      !timingSafeEqual(providedCredentials, expectedCredentials)
    ) {
      return sendUnauthorized(res);
    }

    return next();
  };
}

export function setupSwagger(app: INestApplication) {
  const configService = app.get(ConfigService);
  const swaggerPath = normalizeSwaggerPath(configService.get(ENV.SWAGGER_ENDPOINT) || '/api-docs');
  const title = configService.get(ENV.SWAGGER_TITLE);
  const description = configService.get(ENV.SWAGGER_DESCRIPTION);
  const version = configService.get(ENV.SWAGGER_VERSION);
  const favicon = configService.get(ENV.SWAGGER_FAVICON);
  const swaggerBasicAuthUser = configService.get<string>(ENV.SWAGGER_BASIC_AUTH_USER);
  const swaggerBasicAuthPassword = configService.get<string>(ENV.SWAGGER_BASIC_AUTH_PASSWORD);

  if (
    (swaggerBasicAuthUser && !swaggerBasicAuthPassword) ||
    (!swaggerBasicAuthUser && swaggerBasicAuthPassword)
  ) {
    throw new Error(
      'Swagger basic auth requires both SWAGGER_BASIC_AUTH_USER and SWAGGER_BASIC_AUTH_PASSWORD',
    );
  }

  if (swaggerBasicAuthUser && swaggerBasicAuthPassword) {
    const swaggerAuthMiddleware = createSwaggerAuthMiddleware(
      swaggerBasicAuthUser,
      swaggerBasicAuthPassword,
    );

    app.use(swaggerPath, swaggerAuthMiddleware);
    app.use(`${swaggerPath}-json`, swaggerAuthMiddleware);
  }

  const config = new DocumentBuilder()
    .setTitle(title)
    .setDescription(description)
    .setVersion(version)
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(swaggerPath, app, document, {
    customCss: `.topbar-wrapper { content:url('${favicon}'); height:100px; }`,
    customSiteTitle: title,
    customfavIcon: favicon,
  });
}
