import { Injectable, NotImplementedException } from '@nestjs/common';

import { LoginDto } from './dto/login.dto';
import { ApproveDiscountDto } from './dto/approve-discount.dto';

export interface AuthenticatedUser {
  id: string;
  name: string;
  role: string;
}

export interface LoginResult {
  token: string;
  user: AuthenticatedUser;
}

export interface DiscountApproval {
  approvedByUserId: string;
}

@Injectable()
export class AuthService {
  /**
   * Authenticate a cashier by PIN and issue a session token.
   * TODO: verify PIN hash, load the user, and sign a JWT.
   */
  login(_tenantId: string, _dto: LoginDto): Promise<LoginResult> {
    throw new NotImplementedException('PIN login is not implemented yet');
  }

  /**
   * Inline manager approval for a discount above the configured threshold.
   * TODO: verify the manager PIN and that the user has an approving role.
   */
  approveDiscount(_tenantId: string, _dto: ApproveDiscountDto): Promise<DiscountApproval> {
    throw new NotImplementedException('Discount approval is not implemented yet');
  }
}
