/** Roles and permissions, mirrored from the API for client-side UI gating. */

export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'CASHIER' | 'ACCOUNTANT';

export const Permission = {
  SALE_CREATE: 'sale:create',
  SALE_READ: 'sale:read',
  PAYMENT_CREATE: 'payment:create',
  DISCOUNT_APPROVE: 'discount:approve',
  PRODUCT_READ: 'product:read',
  CUSTOMER_READ: 'customer:read',
  SYNC_READ: 'sync:read',
  QUICKBOOKS_READ: 'quickbooks:read',
  QUICKBOOKS_MANAGE: 'quickbooks:manage',
  SETTINGS_MANAGE: 'settings:manage',
  USER_MANAGE: 'user:manage',
  REPORT_READ: 'report:read',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

const ALL: Permission[] = Object.values(Permission);

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  OWNER: ALL,
  ADMIN: ALL,
  MANAGER: [
    Permission.SALE_CREATE,
    Permission.SALE_READ,
    Permission.PAYMENT_CREATE,
    Permission.DISCOUNT_APPROVE,
    Permission.PRODUCT_READ,
    Permission.CUSTOMER_READ,
    Permission.REPORT_READ,
  ],
  CASHIER: [
    Permission.SALE_CREATE,
    Permission.SALE_READ,
    Permission.PAYMENT_CREATE,
    Permission.PRODUCT_READ,
    Permission.CUSTOMER_READ,
  ],
  ACCOUNTANT: [
    Permission.SYNC_READ,
    Permission.QUICKBOOKS_READ,
    Permission.SALE_READ,
    Permission.PRODUCT_READ,
    Permission.CUSTOMER_READ,
    Permission.REPORT_READ,
  ],
};

export function permissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
