-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('WALK_IN', 'RETAIL', 'CONTRACTOR', 'CREDIT', 'DEALER');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "creditAllowed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "creditLimit" DECIMAL(12,2),
ADD COLUMN     "customerType" "CustomerType" NOT NULL DEFAULT 'RETAIL',
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "taxNumber" TEXT;
