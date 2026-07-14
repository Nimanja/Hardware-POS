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
import type { Paginated } from '@hardware-pos/shared';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { AuthenticatedUser } from '../auth/auth.types';
import { Permission } from '../auth/permissions';
import { QuotationsService } from './quotations.service';
import {
  QuotationDetail,
  QuotationListItem,
  QuotationPreview,
  QuotationRevisionDetail,
  QuotationRevisionSummary,
  QuotationShareResult,
} from './quotations.types';
import { ConvertQuotationDto } from './dto/convert-quotation.dto';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { CreateRevisionDto } from './dto/create-revision.dto';
import { QueryQuotationsDto } from './dto/query-quotations.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { ShareEmailDto, ShareWhatsappDto } from '../sharing/dto/share.dto';

@Controller('quotations')
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  /** Recompute totals for the create/edit screen without persisting. */
  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.QUOTATION_CREATE)
  preview(@TenantId() tenantId: string, @Body() dto: CreateQuotationDto): Promise<QuotationPreview> {
    return this.quotationsService.preview(tenantId, dto);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(Permission.QUOTATION_CREATE)
  create(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateQuotationDto,
  ): Promise<QuotationDetail> {
    return this.quotationsService.create(tenantId, user, dto);
  }

  @Get()
  @RequirePermissions(Permission.QUOTATION_READ)
  list(
    @TenantId() tenantId: string,
    @Query() query: QueryQuotationsDto,
  ): Promise<Paginated<QuotationListItem>> {
    return this.quotationsService.list(tenantId, query);
  }

  @Get(':id')
  @RequirePermissions(Permission.QUOTATION_READ)
  getById(@TenantId() tenantId: string, @Param('id') id: string): Promise<QuotationDetail> {
    return this.quotationsService.getById(tenantId, id);
  }

  @Patch(':id')
  @RequirePermissions(Permission.QUOTATION_CREATE)
  update(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateQuotationDto,
  ): Promise<QuotationDetail> {
    return this.quotationsService.update(tenantId, user, id, dto);
  }

  @Post(':id/revisions')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(Permission.QUOTATION_CREATE)
  createRevision(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateRevisionDto,
  ): Promise<QuotationDetail> {
    return this.quotationsService.createRevision(tenantId, user, id, dto);
  }

  @Get(':id/revisions')
  @RequirePermissions(Permission.QUOTATION_READ)
  listRevisions(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<QuotationRevisionSummary[]> {
    return this.quotationsService.listRevisions(tenantId, id);
  }

  @Get(':id/revisions/:revisionId')
  @RequirePermissions(Permission.QUOTATION_READ)
  getRevision(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Param('revisionId') revisionId: string,
  ): Promise<QuotationRevisionDetail> {
    return this.quotationsService.getRevision(tenantId, id, revisionId);
  }

  @Post(':id/duplicate')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(Permission.QUOTATION_CREATE)
  duplicate(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<QuotationDetail> {
    return this.quotationsService.duplicate(tenantId, user, id);
  }

  @Post(':id/mark-sent')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.QUOTATION_CREATE)
  markSent(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<QuotationDetail> {
    return this.quotationsService.markSent(tenantId, user, id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.QUOTATION_CANCEL)
  cancel(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<QuotationDetail> {
    return this.quotationsService.cancel(tenantId, user, id);
  }

  @Post(':id/convert-to-sale')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(Permission.QUOTATION_CONVERT)
  convertToSale(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ConvertQuotationDto,
  ): Promise<{ saleId: string; saleNumber: string; quotationId: string }> {
    return this.quotationsService.convertToSale(tenantId, user, id, dto);
  }

  /** A4 quotation document (print-ready HTML; `pdfAvailable` if server PDF is on). */
  @Get(':id/pdf')
  @RequirePermissions(Permission.QUOTATION_READ)
  document(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ html: string; pdfAvailable: boolean }> {
    return this.quotationsService.document(tenantId, user, id);
  }

  @Post(':id/share/whatsapp')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.QUOTATION_SHARE)
  shareWhatsapp(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ShareWhatsappDto,
  ): Promise<QuotationShareResult> {
    return this.quotationsService.shareWhatsapp(tenantId, user, id, dto);
  }

  @Post(':id/share/email')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.QUOTATION_SHARE)
  shareEmail(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ShareEmailDto,
  ): Promise<QuotationShareResult> {
    return this.quotationsService.shareEmail(tenantId, user, id, dto);
  }
}
