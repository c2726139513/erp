-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('CUSTOMER', 'SUPPLIER');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('PURCHASE', 'SALES');

-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('RECEIVED', 'ISSUED');

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "clientType" "ClientType" NOT NULL DEFAULT 'CUSTOMER';

-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "contractType" "ContractType" NOT NULL DEFAULT 'PURCHASE';

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "invoiceType" "InvoiceType" NOT NULL DEFAULT 'RECEIVED';

-- CreateIndex
CREATE INDEX "Contract_contractType_idx" ON "Contract"("contractType");

-- CreateIndex
CREATE INDEX "Invoice_invoiceType_idx" ON "Invoice"("invoiceType");
