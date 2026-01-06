-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "descriptionVector" vector(384);
