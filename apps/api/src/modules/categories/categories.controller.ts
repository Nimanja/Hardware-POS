import { Controller, Get, Query } from '@nestjs/common';

import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Permission } from '../auth/permissions';
import { CategoriesService } from './categories.service';
import { CategoryNode } from './categories.repository';

/**
 * Lightweight read endpoint the POS, product form, and category management UI
 * all consume: the two-level category → subcategory tree with product counts.
 */
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @RequirePermissions(Permission.PRODUCT_READ)
  list(
    @TenantId() tenantId: string,
    @Query('active') active?: string,
  ): Promise<CategoryNode[]> {
    return this.categoriesService.list(tenantId, active !== 'true');
  }
}
