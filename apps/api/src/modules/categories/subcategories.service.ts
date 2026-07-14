import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ProductSubcategory } from '@hardware-pos/database';

import { AuditLogService } from '../audit-log/audit-log.service';
import { CategoriesRepository } from './categories.repository';
import { slugify } from './categories.service';
import { CreateSubcategoryDto, UpdateSubcategoryDto } from './dto/subcategory.dto';

@Injectable()
export class SubcategoriesService {
  constructor(
    private readonly categoriesRepository: CategoriesRepository,
    private readonly auditLog: AuditLogService,
  ) {}

  list(tenantId: string, categoryId?: string): Promise<ProductSubcategory[]> {
    return this.categoriesRepository.findSubcategories(tenantId, categoryId);
  }

  async getById(tenantId: string, id: string): Promise<ProductSubcategory> {
    const sub = await this.categoriesRepository.findSubcategoryById(tenantId, id);
    if (!sub) throw new NotFoundException('Subcategory not found');
    return sub;
  }

  private async assertCategory(tenantId: string, categoryId: string): Promise<void> {
    const category = await this.categoriesRepository.findCategoryById(tenantId, categoryId);
    if (!category) throw new NotFoundException('Parent category not found');
  }

  async create(
    tenantId: string,
    userId: string,
    dto: CreateSubcategoryDto,
  ): Promise<ProductSubcategory> {
    await this.assertCategory(tenantId, dto.categoryId);
    if (await this.categoriesRepository.subcategoryNameExists(dto.categoryId, dto.name)) {
      throw new ConflictException(
        `A subcategory named "${dto.name}" already exists in this category`,
      );
    }
    const sub = await this.categoriesRepository.createSubcategory(tenantId, {
      categoryId: dto.categoryId,
      name: dto.name,
      slug: dto.slug ?? slugify(dto.name),
      description: dto.description,
      imageUrl: dto.imageUrl,
      sortOrder: dto.sortOrder,
    });
    await this.auditLog.record(tenantId, {
      userId,
      action: 'subcategory.created',
      entityType: 'ProductSubcategory',
      entityId: sub.id,
      metadata: { name: sub.name, categoryId: sub.categoryId },
    });
    return sub;
  }

  async update(
    tenantId: string,
    userId: string,
    id: string,
    dto: UpdateSubcategoryDto,
  ): Promise<ProductSubcategory> {
    const existing = await this.categoriesRepository.findSubcategoryById(tenantId, id);
    if (!existing) throw new NotFoundException('Subcategory not found');

    if (dto.name && dto.name !== existing.name) {
      if (
        await this.categoriesRepository.subcategoryNameExists(existing.categoryId, dto.name, id)
      ) {
        throw new ConflictException(
          `A subcategory named "${dto.name}" already exists in this category`,
        );
      }
    }

    const sub = await this.categoriesRepository.updateSubcategory(tenantId, id, {
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      imageUrl: dto.imageUrl,
      sortOrder: dto.sortOrder,
      isActive: dto.isActive,
    });
    await this.auditLog.record(tenantId, {
      userId,
      action: 'subcategory.updated',
      entityType: 'ProductSubcategory',
      entityId: id,
      metadata: { name: sub.name },
    });
    return sub;
  }

  async setActive(
    tenantId: string,
    userId: string,
    id: string,
    isActive: boolean,
  ): Promise<ProductSubcategory> {
    const existing = await this.categoriesRepository.findSubcategoryById(tenantId, id);
    if (!existing) throw new NotFoundException('Subcategory not found');

    const sub = await this.categoriesRepository.setSubcategoryActive(tenantId, id, isActive);
    await this.auditLog.record(tenantId, {
      userId,
      action: isActive ? 'subcategory.reactivated' : 'subcategory.deactivated',
      entityType: 'ProductSubcategory',
      entityId: id,
      metadata: { name: sub.name },
    });
    return sub;
  }

  async move(
    tenantId: string,
    userId: string,
    id: string,
    newCategoryId: string,
  ): Promise<ProductSubcategory> {
    const existing = await this.categoriesRepository.findSubcategoryById(tenantId, id);
    if (!existing) throw new NotFoundException('Subcategory not found');
    await this.assertCategory(tenantId, newCategoryId);

    // Name must remain unique within the destination category.
    if (await this.categoriesRepository.subcategoryNameExists(newCategoryId, existing.name, id)) {
      throw new ConflictException(
        `A subcategory named "${existing.name}" already exists in the target category`,
      );
    }

    const sub = await this.categoriesRepository.moveSubcategory(tenantId, id, newCategoryId);
    await this.auditLog.record(tenantId, {
      userId,
      action: 'subcategory.moved',
      entityType: 'ProductSubcategory',
      entityId: id,
      metadata: { name: sub.name, fromCategoryId: existing.categoryId, toCategoryId: newCategoryId },
    });
    return sub;
  }

  async reorder(tenantId: string, userId: string, orderedIds: string[]): Promise<ProductSubcategory[]> {
    await this.categoriesRepository.reorderSubcategories(tenantId, orderedIds);
    await this.auditLog.record(tenantId, {
      userId,
      action: 'subcategory.reordered',
      entityType: 'ProductSubcategory',
      metadata: { count: orderedIds.length },
    });
    return this.list(tenantId);
  }
}
