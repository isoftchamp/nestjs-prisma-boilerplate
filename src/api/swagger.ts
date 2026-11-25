import { type INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { timingSafeEqual } from 'crypto';
import { type NextFunction, type Request, type Response } from 'express';

import { type Configuration, configuration } from '@/config/configuration.js';

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
  const config = app.get<Configuration>(configuration.KEY).swagger;
  const swaggerPath = normalizeSwaggerPath(config.endpoint);
  const { title, description, version, favicon } = config;
  const { username: swaggerBasicAuthUser, password: swaggerBasicAuthPassword } = config.basicAuth;

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

  const documentConfig = new DocumentBuilder()
    .setTitle(title)
    .setDescription(description)
    .setVersion(version)
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, documentConfig);

  SwaggerModule.setup(swaggerPath, app, document, {
    customCss: `.topbar-wrapper { content:url('${favicon}'); height:100px; }`,
    customSiteTitle: title,
    customfavIcon: favicon,
  });
}
