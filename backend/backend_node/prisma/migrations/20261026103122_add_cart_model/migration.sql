-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'COMPLETED';

-- CreateTable
CREATE TABLE "Cart" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" SERIAL NOT NULL,
    "cartId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyKey" (
    "key" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "orderId" INTEGER NOT NULL,
    "response" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cart_userId_key" ON "Cart"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_productId_key" ON "CartItem"("cartId", "productId");

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DataMigration: the old app modeled the cart as an Order with status='PENDING'.
-- Move every such order's items into the new Cart/CartItem tables, then remove
-- the PENDING orders so /api/orders only ever returns real, placed orders.
INSERT INTO "Cart" ("userId", "updatedAt")
SELECT DISTINCT "userId", CURRENT_TIMESTAMP
FROM "Order"
WHERE "status" = 'PENDING'
ON CONFLICT ("userId") DO NOTHING;

INSERT INTO "CartItem" ("cartId", "productId", "quantity", "createdAt")
SELECT c."id", agg."productId", agg."quantity", CURRENT_TIMESTAMP
FROM (
  SELECT o."userId", oi."productId", SUM(oi."quantity")::int AS "quantity"
  FROM "OrderItem" oi
  JOIN "Order" o ON o."id" = oi."orderId"
  WHERE o."status" = 'PENDING'
  GROUP BY o."userId", oi."productId"
) agg
JOIN "Cart" c ON c."userId" = agg."userId"
ON CONFLICT ("cartId", "productId") DO UPDATE SET "quantity" = "CartItem"."quantity" + EXCLUDED."quantity";

DELETE FROM "OrderItem" WHERE "orderId" IN (SELECT "id" FROM "Order" WHERE "status" = 'PENDING');

DELETE FROM "Order" WHERE "status" = 'PENDING';
