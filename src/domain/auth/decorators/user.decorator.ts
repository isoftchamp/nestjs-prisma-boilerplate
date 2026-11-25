import { type ExecutionContext, createParamDecorator } from '@nestjs/common';

export const User = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;

  // If a property name is specified, return that property
  // Otherwise return the entire user object
  return data ? user?.[data] : user;
});
