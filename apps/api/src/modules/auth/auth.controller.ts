import { Body, Controller, Post } from '@nestjs/common';

import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { AuthService, DiscountApproval, LoginResult } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ApproveDiscountDto } from './dto/approve-discount.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@TenantId() tenantId: string, @Body() dto: LoginDto): Promise<LoginResult> {
    return this.authService.login(tenantId, dto);
  }

  @Post('approve-discount')
  approveDiscount(
    @TenantId() tenantId: string,
    @Body() dto: ApproveDiscountDto,
  ): Promise<DiscountApproval> {
    return this.authService.approveDiscount(tenantId, dto);
  }
}
