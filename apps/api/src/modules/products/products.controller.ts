import { Controller, Get, Param, Query } from '@nestjs/common';
import { Product } from '@hardware-pos/database';
import type { Paginated } from '@hardware-pos/shared';

import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { ProductsService } from './products.service';
import { QueryProductsDto } from './dto/query-products.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  list(
    @TenantId() tenantId: string,
    @Query() query: QueryProductsDto,
  ): Promise<Paginated<Product>> {
    return this.productsService.list(tenantId, query);
  }

  @Get('barcode/:barcode')
  getByBarcode(
    @TenantId() tenantId: string,
    @Param('barcode') barcode: string,
  ): Promise<Product> {
    return this.productsService.getByBarcode(tenantId, barcode);
  }

  @Get(':id')
  getById(@TenantId() tenantId: string, @Param('id') id: string): Promise<Product> {
    return this.productsService.getById(tenantId, id);
  }
}
