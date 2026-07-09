import { plainToInstance, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min, validateSync } from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

/**
 * Typed, validated view of process.env. Wired into ConfigModule via `validate`
 * so the app fails fast on boot if required configuration is missing.
 */
export class EnvironmentVariables {
  @IsEnum(NodeEnv)
  @IsOptional()
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  API_PORT = 4000;

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  @IsOptional()
  WEB_ORIGIN?: string;

  @IsString()
  JWT_SECRET!: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN = '12h';

  // ── QuickBooks Online (placeholders — integration not implemented yet) ──
  @IsString()
  @IsOptional()
  QBO_CLIENT_ID?: string;

  @IsString()
  @IsOptional()
  QBO_CLIENT_SECRET?: string;

  @IsString()
  @IsOptional()
  QBO_REDIRECT_URI?: string;

  @IsString()
  @IsOptional()
  QBO_ENVIRONMENT?: string;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n${errors.toString()}`);
  }

  return validated;
}
