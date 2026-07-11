-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "orderDiscountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "orderDiscountApprovedById" TEXT,
ADD COLUMN     "orderDiscountReason" TEXT,
ADD COLUMN     "orderDiscountType" "DiscountType",
ADD COLUMN     "orderDiscountValue" DECIMAL(12,2);
