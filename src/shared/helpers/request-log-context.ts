import { AsyncLocalStorage } from 'async_hooks';

export type RequestLogSource = {
  method?: string;
  originalUrl?: string;
  url?: string;
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
  user?: unknown;
};

export type RequestLogContextSnapshot = {
  requestId?: string;
  request: {
    method?: string;
    url?: string;
    host?: string;
    origin?: string | string[];
    userAgent?: string | string[];
  };
  userId?: string;
};

type ActiveRequestLogContext = RequestLogContextSnapshot & {
  getUserId?: () => string | undefined;
};

const requestLogStorage = new AsyncLocalStorage<ActiveRequestLogContext>();

export function createRequestLogContext(request: RequestLogSource): ActiveRequestLogContext {
  return {
    requestId: getHeaderValue(request.headers?.['x-request-id']),
    request: {
      method: request.method,
      url: sanitizeLogUrl(request.originalUrl || request.url),
      host: request.ip,
      origin: request.headers?.origin,
      userAgent: request.headers?.['user-agent'],
    },
    getUserId: () => getLogUserId(request.user),
  };
}

export function runWithRequestLogContext<T>(
  context: ActiveRequestLogContext,
  callback: () => T,
): T {
  return requestLogStorage.run(context, callback);
}

export function getCurrentRequestLogContext(): RequestLogContextSnapshot | undefined {
  const context = requestLogStorage.getStore();
  if (!context) {
    return undefined;
  }

  return compactLogContext({
    requestId: context.requestId,
    request: context.request,
    userId: context.getUserId?.() ?? context.userId,
  });
}

export function sanitizeLogUrl(url: string | undefined): string | undefined {
  return typeof url === 'string' ? url.split('?')[0] : undefined;
}

export function getLogUserId(user: unknown): string | undefined {
  if (!user || typeof user !== 'object') {
    return undefined;
  }

  const record = user as { id?: unknown; _id?: unknown; sub?: unknown };
  const id = record.id ?? record._id ?? record.sub;

  return typeof id === 'string' ? id : undefined;
}

function getHeaderValue(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function compactLogContext(context: RequestLogContextSnapshot): RequestLogContextSnapshot {
  return {
    ...(context.requestId ? { requestId: context.requestId } : {}),
    request: Object.fromEntries(
      Object.entries(context.request).filter(([, value]) => value !== undefined),
    ),
    ...(context.userId ? { userId: context.userId } : {}),
  };
}
