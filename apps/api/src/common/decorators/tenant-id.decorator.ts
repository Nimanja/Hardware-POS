import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Resolves the current tenant id.
 *
 * TODO(auth): this is a placeholder that reads the `x-tenant-id` request header.
 * Once the auth module issues session tokens, the tenant id will come from the
 * authenticated principal instead of a client-supplied header.
 */
export const TenantId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<Request>();
  const tenantId = request.headers['x-tenant-id'];

  if (typeof tenantId !== 'string' || tenantId.length === 0) {
    throw new BadRequestException('Missing required header: x-tenant-id');
  }

  return tenantId;
});
