import { Module } from '@nestjs/common';

import { AuditLogModule } from '../audit-log/audit-log.module';
import { CategoriesController } from './categories.controller';
import { CategoriesRepository } from './categories.repository';
import { CategoriesService } from './categories.service';
import { ProductCategoriesController } from './product-categories.controller';
import { ProductSubcategoriesController } from './product-subcategories.controller';
import { SubcategoriesService } from './subcategories.service';

@Module({
  imports: [AuditLogModule],
  controllers: [
    CategoriesController,
    ProductCategoriesController,
    ProductSubcategoriesController,
  ],
  providers: [CategoriesService, SubcategoriesService, CategoriesRepository],
  exports: [CategoriesService, SubcategoriesService],
})
export class CategoriesModule {}
