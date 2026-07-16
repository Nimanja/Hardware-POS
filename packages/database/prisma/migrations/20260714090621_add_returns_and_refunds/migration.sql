-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'COMPLETED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReturnReason" AS ENUM ('WRONG_PRODUCT', 'DAMAGED', 'DEFECTIVE', 'EXTRA_QUANTITY', 'CHANGED_MIND', 'NOT_SUITABLE', 'OTHER');

-- CreateEnum
CREATE TYPE "ItemCondition" AS ENUM ('GOOD', 'DAMAGED', 'DEFECTIVE', 'OPENED_USED', 'NON_RESELLABLE');

-- CreateEnum
CREATE TYPE "StockDisposition" AS ENUM ('RETURN_TO_STOCK', 'DAMAGED_STOCK', 'SUPPLIER_REVIEW', 'DO_NOT_RESTOCK');

-- CreateEnum
CREATE TYPE "SaleReturnStatus" AS ENUM ('NOT_RETURNED', 'PARTIALLY_RETURNED', 'FULLY_RETURNED');

-- CreateEnum
CREATE TYPE "QuickBooksReturnDocumentType" AS ENUM ('REFUND_RECEIPT', 'CREDIT_MEMO');

-- AlterEnum
ALTER TYPE "PrintJobType" ADD VALUE 'RETURN_RECEIPT';

-- AlterTable
ALTER TABLE "PrintJob" ADD COLUMN     "returnId" TEXT;

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "returnStatus" "SaleReturnStatus" NOT NULL DEFAULT 'NOT_RETURNED',
ADD COLUMN     "returnedAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SaleItem" ADD COLUMN     "returnStatus" "SaleReturnStatus" NOT NULL DEFAULT 'NOT_RETURNED',
ADD COLUMN     "returnedQuantity" DECIMAL(12,3) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Return" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "registerId" TEXT,
    "originalSaleId" TEXT NOT NULL,
    "customerId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "approvedByUserId" TEXT,
    "approvalToken" TEXT,
    "returnNumber" TEXT NOT NULL,
    "status" "ReturnStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "productDiscountAdjustment" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "orderDiscountAdjustment" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxAdjustment" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "refundTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "refundMethod" "PaymentMethod",
    "refundReference" TEXT,
    "refundStatus" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "quickbooksDocumentType" "QuickBooksReturnDocumentType",
    "quickbooksDocumentId" TEXT,
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'NOT_SYNCED',
    "syncError" TEXT,
    "notes" TEXT,
    "idempotencyKey" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Return_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnItem" (
    "id" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "originalSaleItemId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productNameSnapshot" TEXT NOT NULL,
    "skuSnapshot" TEXT,
    "imageUrlSnapshot" TEXT,
    "originalUnitPrice" DECIMAL(12,2) NOT NULL,
    "purchasedQuantity" DECIMAL(12,3) NOT NULL,
    "previouslyReturnedQuantity" DECIMAL(12,3) NOT NULL,
    "returnQuantity" DECIMAL(12,3) NOT NULL,
    "returnReason" "ReturnReason" NOT NULL,
    "itemCondition" "ItemCondition" NOT NULL,
    "stockDisposition" "StockDisposition" NOT NULL,
    "note" TEXT,
    "originalLineSubtotal" DECIMAL(12,2) NOT NULL,
    "productDiscountAdjustment" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "orderDiscountAdjustment" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxAdjustment" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "refundableAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReturnItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefundPayment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "processedByUserId" TEXT,
    "method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reference" TEXT,
    "metadata" JSONB,
    "quickbooksPaymentId" TEXT,
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'NOT_SYNCED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefundPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Return_tenantId_idx" ON "Return"("tenantId");

-- CreateIndex
CREATE INDEX "Return_branchId_idx" ON "Return"("branchId");

-- CreateIndex
CREATE INDEX "Return_originalSaleId_idx" ON "Return"("originalSaleId");

-- CreateIndex
CREATE INDEX "Return_customerId_idx" ON "Return"("customerId");

-- CreateIndex
CREATE INDEX "Return_createdByUserId_idx" ON "Return"("createdByUserId");

-- CreateIndex
CREATE INDEX "Return_status_idx" ON "Return"("status");

-- CreateIndex
CREATE INDEX "Return_syncStatus_idx" ON "Return"("syncStatus");

-- CreateIndex
CREATE INDEX "Return_createdAt_idx" ON "Return"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Return_tenantId_returnNumber_key" ON "Return"("tenantId", "returnNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Return_tenantId_idempotencyKey_key" ON "Return"("tenantId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "ReturnItem_returnId_idx" ON "ReturnItem"("returnId");

-- CreateIndex
CREATE INDEX "ReturnItem_originalSaleItemId_idx" ON "ReturnItem"("originalSaleItemId");

-- CreateIndex
CREATE INDEX "ReturnItem_productId_idx" ON "ReturnItem"("productId");

-- CreateIndex
CREATE INDEX "RefundPayment_tenantId_idx" ON "RefundPayment"("tenantId");

-- CreateIndex
CREATE INDEX "RefundPayment_returnId_idx" ON "RefundPayment"("returnId");

-- CreateIndex
CREATE INDEX "RefundPayment_syncStatus_idx" ON "RefundPayment"("syncStatus");

-- CreateIndex
CREATE INDEX "PrintJob_returnId_idx" ON "PrintJob"("returnId");

-- AddForeignKey
ALTER TABLE "PrintJob" ADD CONSTRAINT "PrintJob_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "Return"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Return" ADD CONSTRAINT "Return_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Return" ADD CONSTRAINT "Return_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Return" ADD CONSTRAINT "Return_registerId_fkey" FOREIGN KEY ("registerId") REFERENCES "Register"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Return" ADD CONSTRAINT "Return_originalSaleId_fkey" FOREIGN KEY ("originalSaleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Return" ADD CONSTRAINT "Return_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Return" ADD CONSTRAINT "Return_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Return" ADD CONSTRAINT "Return_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "Return"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_originalSaleItemId_fkey" FOREIGN KEY ("originalSaleItemId") REFERENCES "SaleItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundPayment" ADD CONSTRAINT "RefundPayment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundPayment" ADD CONSTRAINT "RefundPayment_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "Return"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundPayment" ADD CONSTRAINT "RefundPayment_processedByUserId_fkey" FOREIGN KEY ("processedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
