import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ProductSubcategory } from '@hardware-pos/database';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { AuthenticatedUser } from '../auth/auth.types';
import { Permission } from '../auth/permissions';
import { ReorderDto } from './dto/category.dto';
import {
  CreateSubcategoryDto,
  MoveSubcategoryDto,
  UpdateSubcategoryDto,
} from './dto/subcategory.dto';
import { SubcategoriesService } from './subcategories.service';

@Controller('product-subcategories')
export class ProductSubcategoriesController {
  constructor(private readonly subcategoriesService: SubcategoriesService) {}

  @Get()
  @RequirePermissions(Permission.PRODUCT_READ)
  list(
    @TenantId() tenantId: string,
    @Query('categoryId') categoryId?: string,
  ): Promise<ProductSubcategory[]> {
    return this.subcategoriesService.list(tenantId, categoryId);
  }

  @Post()
  @RequirePermissions(Permission.CATEGORY_MANAGE)
  create(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSubcategoryDto,
  ): Promise<ProductSubcategory> {
    return this.subcategoriesService.create(tenantId, user.id, dto);
  }

  @Post('reorder')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.CATEGORY_MANAGE)
  reorder(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReorderDto,
  ): Promise<ProductSubcategory[]> {
    return this.subcategoriesService.reorder(tenantId, user.id, dto.orderedIds);
  }

  @Get(':id')
  @RequirePermissions(Permission.PRODUCT_READ)
  getById(@TenantId() tenantId: string, @Param('id') id: string): Promise<ProductSubcategory> {
    return this.subcategoriesService.getById(tenantId, id);
  }

  @Patch(':id')
  @RequirePermissions(Permission.CATEGORY_MANAGE)
  update(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateSubcategoryDto,
  ): Promise<ProductSubcategory> {
    return this.subcategoriesService.update(tenantId, user.id, id, dto);
  }

  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.CATEGORY_MANAGE)
  deactivate(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ProductSubcategory> {
    return this.subcategoriesService.setActive(tenantId, user.id, id, false);
  }

  @Post(':id/reactivate')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.CATEGORY_MANAGE)
  reactivate(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ProductSubcategory> {
    return this.subcategoriesService.setActive(tenantId, user.id, id, true);
  }

  @Post(':id/move')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.CATEGORY_MANAGE)
  move(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: MoveSubcategoryDto,
  ): Promise<ProductSubcategory> {
    return this.subcategoriesService.move(tenantId, user.id, id, dto.categoryId);
  }
}
