import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ProductCategory } from '@hardware-pos/database';

import { AuditLogService } from '../audit-log/audit-log.service';
import { CategoriesRepository, CategoryNode } from './categories.repository';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

/** Lowercase, hyphenated slug derived from a name. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class CategoriesService {
  constructor(
    private readonly categoriesRepository: CategoriesRepository,
    private readonly auditLog: AuditLogService,
  ) {}

  /** The two-level catalog tree used by the POS, product form, and management UI. */
  list(tenantId: string, includeInactive = true): Promise<CategoryNode[]> {
    return this.categoriesRepository.findTree(tenantId, includeInactive);
  }

  async getById(tenantId: string, id: string): Promise<CategoryNode> {
    const node = await this.categoriesRepository.findCategoryNode(tenantId, id);
    if (!node) throw new NotFoundException('Category not found');
    return node;
  }

  async create(tenantId: string, userId: string, dto: CreateCategoryDto): Promise<ProductCategory> {
    if (await this.categoriesRepository.categoryNameExists(tenantId, dto.name)) {
      throw new ConflictException(`A category named "${dto.name}" already exists`);
    }
    const category = await this.categoriesRepository.createCategory(tenantId, {
      name: dto.name,
      slug: dto.slug ?? slugify(dto.name),
      description: dto.description,
      imageUrl: dto.imageUrl,
      sortOrder: dto.sortOrder,
    });
    await this.auditLog.record(tenantId, {
      userId,
      action: 'category.created',
      entityType: 'ProductCategory',
      entityId: category.id,
      metadata: { name: category.name },
    });
    return category;
  }

  async update(
    tenantId: string,
    userId: string,
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<ProductCategory> {
    const existing = await this.categoriesRepository.findCategoryById(tenantId, id);
    if (!existing) throw new NotFoundException('Category not found');

    if (dto.name && dto.name !== existing.name) {
      if (await this.categoriesRepository.categoryNameExists(tenantId, dto.name, id)) {
        throw new ConflictException(`A category named "${dto.name}" already exists`);
      }
    }

    const category = await this.categoriesRepository.updateCategory(tenantId, id, {
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      imageUrl: dto.imageUrl,
      sortOrder: dto.sortOrder,
      isActive: dto.isActive,
    });
    await this.auditLog.record(tenantId, {
      userId,
      action: 'category.updated',
      entityType: 'ProductCategory',
      entityId: id,
      metadata: { name: category.name },
    });
    return category;
  }

  async setActive(
    tenantId: string,
    userId: string,
    id: string,
    isActive: boolean,
  ): Promise<ProductCategory> {
    const existing = await this.categoriesRepository.findCategoryById(tenantId, id);
    if (!existing) throw new NotFoundException('Category not found');

    const category = await this.categoriesRepository.setCategoryActive(tenantId, id, isActive);
    await this.auditLog.record(tenantId, {
      userId,
      action: isActive ? 'category.reactivated' : 'category.deactivated',
      entityType: 'ProductCategory',
      entityId: id,
      metadata: { name: category.name },
    });
    return category;
  }

  async reorder(tenantId: string, userId: string, orderedIds: string[]): Promise<CategoryNode[]> {
    await this.categoriesRepository.reorderCategories(tenantId, orderedIds);
    await this.auditLog.record(tenantId, {
      userId,
      action: 'category.reordered',
      entityType: 'ProductCategory',
      metadata: { count: orderedIds.length },
    });
    return this.list(tenantId);
  }
}
