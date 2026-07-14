import { Injectable } from '@nestjs/common';
import { Prisma, ProductCategory, ProductSubcategory } from '@hardware-pos/database';

import { PrismaService } from '../../prisma/prisma.service';

/** One subcategory node in the category tree returned to the front-end. */
export interface SubcategoryNode {
  id: string;
  categoryId: string;
  name: string;
  slug: string | null;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
}

/** A category with its subcategories + product count, ordered for display. */
export interface CategoryNode {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  quickbooksItemId: string | null;
  productCount: number;
  subcategoryCount: number;
  subcategories: SubcategoryNode[];
}

export interface CreateCategoryData {
  name: string;
  slug?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
}

export interface UpdateCategoryData {
  name?: string;
  slug?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CreateSubcategoryData extends CreateCategoryData {
  categoryId: string;
}

export type UpdateSubcategoryData = UpdateCategoryData;

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Tree read ────────────────────────────────────────────────

  /** Full two-level catalog tree for a tenant, ordered by sortOrder then name. */
  async findTree(tenantId: string, includeInactive = true): Promise<CategoryNode[]> {
    const where: Prisma.ProductCategoryWhereInput = { tenantId };
    if (!includeInactive) where.isActive = true;

    const categories = await this.prisma.productCategory.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { products: true } },
        subcategories: {
          ...(includeInactive ? {} : { where: { isActive: true } }),
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          include: { _count: { select: { products: true } } },
        },
      },
    });

    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      imageUrl: c.imageUrl,
      sortOrder: c.sortOrder,
      isActive: c.isActive,
      quickbooksItemId: c.quickbooksItemId,
      productCount: c._count.products,
      subcategoryCount: c.subcategories.length,
      subcategories: c.subcategories.map((s) => ({
        id: s.id,
        categoryId: s.categoryId,
        name: s.name,
        slug: s.slug,
        description: s.description,
        imageUrl: s.imageUrl,
        sortOrder: s.sortOrder,
        isActive: s.isActive,
        productCount: s._count.products,
      })),
    }));
  }

  // ── Categories ───────────────────────────────────────────────

  findCategoryById(tenantId: string, id: string): Promise<ProductCategory | null> {
    return this.prisma.productCategory.findFirst({ where: { id, tenantId } });
  }

  async findCategoryNode(tenantId: string, id: string): Promise<CategoryNode | null> {
    const tree = await this.findTree(tenantId);
    return tree.find((c) => c.id === id) ?? null;
  }

  async categoryNameExists(tenantId: string, name: string, exceptId?: string): Promise<boolean> {
    const found = await this.prisma.productCategory.findFirst({
      where: {
        tenantId,
        name: { equals: name, mode: 'insensitive' },
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
      select: { id: true },
    });
    return found !== null;
  }

  createCategory(tenantId: string, data: CreateCategoryData): Promise<ProductCategory> {
    return this.prisma.productCategory.create({
      data: {
        tenantId,
        name: data.name,
        slug: data.slug ?? null,
        description: data.description ?? null,
        imageUrl: data.imageUrl ?? null,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  updateCategory(tenantId: string, id: string, data: UpdateCategoryData): Promise<ProductCategory> {
    return this.prisma.productCategory.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
  }

  /** Also deactivates the category's subcategories, so the POS stops showing them. */
  async setCategoryActive(
    tenantId: string,
    id: string,
    isActive: boolean,
  ): Promise<ProductCategory> {
    return this.prisma.$transaction(async (tx) => {
      if (!isActive) {
        await tx.productSubcategory.updateMany({
          where: { tenantId, categoryId: id },
          data: { isActive: false },
        });
      }
      return tx.productCategory.update({ where: { id }, data: { isActive } });
    });
  }

  async reorderCategories(tenantId: string, orderedIds: string[]): Promise<void> {
    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.productCategory.updateMany({ where: { id, tenantId }, data: { sortOrder: index } }),
      ),
    );
  }

  // ── Subcategories ────────────────────────────────────────────

  findSubcategories(tenantId: string, categoryId?: string): Promise<ProductSubcategory[]> {
    return this.prisma.productSubcategory.findMany({
      where: { tenantId, ...(categoryId ? { categoryId } : {}) },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  findSubcategoryById(tenantId: string, id: string): Promise<ProductSubcategory | null> {
    return this.prisma.productSubcategory.findFirst({ where: { id, tenantId } });
  }

  async subcategoryNameExists(categoryId: string, name: string, exceptId?: string): Promise<boolean> {
    const found = await this.prisma.productSubcategory.findFirst({
      where: {
        categoryId,
        name: { equals: name, mode: 'insensitive' },
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
      select: { id: true },
    });
    return found !== null;
  }

  createSubcategory(tenantId: string, data: CreateSubcategoryData): Promise<ProductSubcategory> {
    return this.prisma.productSubcategory.create({
      data: {
        tenantId,
        categoryId: data.categoryId,
        name: data.name,
        slug: data.slug ?? null,
        description: data.description ?? null,
        imageUrl: data.imageUrl ?? null,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  updateSubcategory(
    tenantId: string,
    id: string,
    data: UpdateSubcategoryData,
  ): Promise<ProductSubcategory> {
    return this.prisma.productSubcategory.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
  }

  setSubcategoryActive(
    tenantId: string,
    id: string,
    isActive: boolean,
  ): Promise<ProductSubcategory> {
    return this.prisma.productSubcategory.update({ where: { id }, data: { isActive } });
  }

  async reorderSubcategories(tenantId: string, orderedIds: string[]): Promise<void> {
    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.productSubcategory.updateMany({
          where: { id, tenantId },
          data: { sortOrder: index },
        }),
      ),
    );
  }

  /**
   * Reassign a subcategory to another category. Products under the subcategory
   * have their categoryId realigned so `product.categoryId === subcategory.categoryId`
   * stays true (spec §17 validation).
   */
  async moveSubcategory(
    tenantId: string,
    id: string,
    newCategoryId: string,
  ): Promise<ProductSubcategory> {
    return this.prisma.$transaction(async (tx) => {
      await tx.product.updateMany({
        where: { tenantId, subcategoryId: id },
        data: { categoryId: newCategoryId },
      });
      return tx.productSubcategory.update({ where: { id }, data: { categoryId: newCategoryId } });
    });
  }
}
