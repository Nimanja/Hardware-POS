import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { AuthenticatedUser, AuthTokenResult } from './auth.types';
import { AuthService, CurrentUserView, DiscountApproval } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { PinLoginDto } from './dto/pin-login.dto';
import { ApproveDiscountDto } from './dto/approve-discount.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Email + password login (owner / admin / accountant). */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<AuthTokenResult> {
    return this.authService.login(dto);
  }

  /** PIN login (cashier / manager). Tenant comes from the x-tenant-id header. */
  @Public()
  @Post('pin-login')
  @HttpCode(HttpStatus.OK)
  pinLogin(@TenantId() tenantId: string, @Body() dto: PinLoginDto): Promise<AuthTokenResult> {
    return this.authService.pinLogin(tenantId, dto);
  }

  /** The authenticated user plus their effective permissions. */
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser): Promise<CurrentUserView> {
    return this.authService.getCurrentUser(user.id);
  }

  /** Inline manager approval for a high discount (cashier submits a manager PIN). */
  @Post('approve-discount')
  @HttpCode(HttpStatus.OK)
  approveDiscount(
    @TenantId() tenantId: string,
    @Body() dto: ApproveDiscountDto,
  ): Promise<DiscountApproval> {
    return this.authService.approveDiscount(tenantId, dto);
  }
}
