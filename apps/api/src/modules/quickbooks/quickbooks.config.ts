import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const DEFAULT_AUTHORIZE_URL = 'https://appcenter.intuit.com/connect/oauth2';
const DEFAULT_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
const DEFAULT_REVOKE_URL = 'https://developer.api.intuit.com/v2/oauth2/tokens/revoke';

/** Accounting scope; enough to read items/customers and write sales documents. */
export const QBO_SCOPE = 'com.intuit.quickbooks.accounting';

export interface ResolvedQuickBooksConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  environment: string;
  authorizeUrl: string;
  tokenUrl: string;
  revokeUrl: string;
  encryptionKey: string;
  webOrigin: string;
}

@Injectable()
export class QuickBooksConfig {
  constructor(private readonly config: ConfigService) {}

  /** Resolve the config, throwing 503 if QBO OAuth is not fully configured. */
  resolve(): ResolvedQuickBooksConfig {
    const clientId = this.config.get<string>('QUICKBOOKS_CLIENT_ID');
    const clientSecret = this.config.get<string>('QUICKBOOKS_CLIENT_SECRET');
    const redirectUri = this.config.get<string>('QUICKBOOKS_REDIRECT_URI');
    const encryptionKey = this.config.get<string>('TOKEN_ENCRYPTION_KEY');

    const missing = [
      !clientId && 'QUICKBOOKS_CLIENT_ID',
      !clientSecret && 'QUICKBOOKS_CLIENT_SECRET',
      !redirectUri && 'QUICKBOOKS_REDIRECT_URI',
      !encryptionKey && 'TOKEN_ENCRYPTION_KEY',
    ].filter(Boolean);
    if (missing.length > 0) {
      throw new ServiceUnavailableException(
        `QuickBooks is not configured. Missing: ${missing.join(', ')}`,
      );
    }

    return {
      clientId: clientId!,
      clientSecret: clientSecret!,
      redirectUri: redirectUri!,
      environment: this.config.get<string>('QUICKBOOKS_ENVIRONMENT', 'sandbox'),
      authorizeUrl: this.config.get<string>('QUICKBOOKS_AUTHORIZE_URL', DEFAULT_AUTHORIZE_URL),
      tokenUrl: this.config.get<string>('QUICKBOOKS_TOKEN_URL', DEFAULT_TOKEN_URL),
      revokeUrl: this.config.get<string>('QUICKBOOKS_REVOKE_URL', DEFAULT_REVOKE_URL),
      encryptionKey: encryptionKey!,
      webOrigin: this.config.get<string>('WEB_ORIGIN', 'http://localhost:3000'),
    };
  }

  isConfigured(): boolean {
    return (
      !!this.config.get('QUICKBOOKS_CLIENT_ID') &&
      !!this.config.get('QUICKBOOKS_CLIENT_SECRET') &&
      !!this.config.get('QUICKBOOKS_REDIRECT_URI') &&
      !!this.config.get('TOKEN_ENCRYPTION_KEY')
    );
  }
}
