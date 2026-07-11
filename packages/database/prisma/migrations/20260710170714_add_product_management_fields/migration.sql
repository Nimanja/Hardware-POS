-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "costPrice" DECIMAL(12,2),
ADD COLUMN     "imageAltText" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "reorderLevel" DECIMAL(12,3),
ADD COLUMN     "taxable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "trackInventory" BOOLEAN NOT NULL DEFAULT true;
