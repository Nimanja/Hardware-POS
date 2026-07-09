import { Injectable, NotImplementedException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import {
  QuickBooksAuthUrl,
  QuickBooksCallbackResult,
  QuickBooksConnectionStatus,
  QuickBooksPort,
} from './quickbooks.interfaces';

/**
 * Placeholder QuickBooks service. Read of the local connection record is
 * implemented so the UI can show connection status; OAuth and API calls throw
 * NotImplemented until the integration is built.
 */
@Injectable()
export class QuickBooksService implements QuickBooksPort {
  constructor(private readonly prisma: PrismaService) {}

  async getConnectionStatus(tenantId: string): Promise<QuickBooksConnectionStatus> {
    const connection = await this.prisma.quickBooksConnection.findUnique({ where: { tenantId } });

    if (!connection) {
      return { connected: false, realmId: null, environment: null, tokenExpiresAt: null };
    }

    return {
      connected: connection.isActive,
      realmId: connection.realmId,
      environment: connection.environment,
      tokenExpiresAt: connection.accessTokenExpiresAt?.toISOString() ?? null,
    };
  }

  getAuthorizationUrl(_tenantId: string): Promise<QuickBooksAuthUrl> {
    throw new NotImplementedException('QuickBooks OAuth is not implemented yet');
  }

  handleCallback(
    _tenantId: string,
    _code: string,
    _realmId: string,
  ): Promise<QuickBooksCallbackResult> {
    throw new NotImplementedException('QuickBooks OAuth callback is not implemented yet');
  }
}
