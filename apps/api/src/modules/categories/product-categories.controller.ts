import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ProductCategory } from '@hardware-pos/database';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { AuthenticatedUser } from '../auth/auth.types';
import { Permission } from '../auth/permissions';
import { CategoriesService } from './categories.service';
import { CategoryNode } from './categories.repository';
import { CreateCategoryDto, ReorderDto, UpdateCategoryDto } from './dto/category.dto';

@Controller('product-categories')
export class ProductCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @RequirePermissions(Permission.PRODUCT_READ)
  list(@TenantId() tenantId: string): Promise<CategoryNode[]> {
    return this.categoriesService.list(tenantId);
  }

  @Post()
  @RequirePermissions(Permission.CATEGORY_MANAGE)
  create(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCategoryDto,
  ): Promise<ProductCategory> {
    return this.categoriesService.create(tenantId, user.id, dto);
  }

  /** Persist a new category ordering. Must precede the ':id' routes. */
  @Post('reorder')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.CATEGORY_MANAGE)
  reorder(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReorderDto,
  ): Promise<CategoryNode[]> {
    return this.categoriesService.reorder(tenantId, user.id, dto.orderedIds);
  }

  @Get(':id')
  @RequirePermissions(Permission.PRODUCT_READ)
  getById(@TenantId() tenantId: string, @Param('id') id: string): Promise<CategoryNode> {
    return this.categoriesService.getById(tenantId, id);
  }

  @Patch(':id')
  @RequirePermissions(Permission.CATEGORY_MANAGE)
  update(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<ProductCategory> {
    return this.categoriesService.update(tenantId, user.id, id, dto);
  }

  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.CATEGORY_MANAGE)
  deactivate(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ProductCategory> {
    return this.categoriesService.setActive(tenantId, user.id, id, false);
  }

  @Post(':id/reactivate')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.CATEGORY_MANAGE)
  reactivate(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ProductCategory> {
    return this.categoriesService.setActive(tenantId, user.id, id, true);
  }
}
