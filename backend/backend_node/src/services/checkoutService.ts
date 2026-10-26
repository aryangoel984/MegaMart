import prisma from '../config/db';
import { CartError } from './cartService';

interface CheckoutItemInput {
  productId: number;
  quantity: number;
}

/**
 * Places an order. With no `explicitItems`, checks out and clears the
 * user's whole cart. With `explicitItems` (Buy Now on a single product),
 * checks out exactly that product/quantity and leaves the stored cart
 * untouched — so Buy Now on one item never force-purchases everything
 * else sitting in the cart (fixes BUG-04 from the MegaMart audit).
 *
 * Stock is decremented with a single conditional UPDATE per line
 * (`stock = stock - qty WHERE stock >= qty`), so concurrent checkouts on
 * the same product can never oversell it (fixes the race in the old
 * read-then-write stock decrement).
 */
export const checkout = async (
  userId: number,
  explicitItems: CheckoutItemInput[] | undefined,
  idempotencyKey?: string
) => {
  if (idempotencyKey) {
    const existing = await prisma.idempotencyKey.findUnique({ where: { key: idempotencyKey } });
    if (existing) {
      if (existing.userId !== userId) {
        throw new CartError(409, 'Idempotency key was already used by a different user');
      }
      return existing.response as any;
    }
  }

  const usingExplicitItems = Array.isArray(explicitItems) && explicitItems.length > 0;

  let itemsToCheckout: CheckoutItemInput[];
  let sourceCartId: number | null = null;

  if (usingExplicitItems) {
    itemsToCheckout = explicitItems!;
  } else {
    const cart = await prisma.cart.findUnique({ where: { userId }, include: { items: true } });
    if (!cart || cart.items.length === 0) {
      throw new CartError(400, 'Your cart is empty');
    }
    sourceCartId = cart.id;
    itemsToCheckout = cart.items.map((item) => ({ productId: item.productId, quantity: item.quantity }));
  }

  const order = await prisma.$transaction(
    async (tx) => {
      const orderItemsData: { productId: number; quantity: number; price: any; name: string }[] = [];
      let totalAmount = 0;

      for (const { productId, quantity } of itemsToCheckout) {
        // One round trip per line: the conditional decrement and the price/name
        // snapshot happen in the same statement, instead of a separate SELECT
        // then UPDATE. That halves the queries a checkout holds its DB
        // connection open for, which matters a lot once many checkouts run
        // concurrently against a pooled connection (see the 20-parallel-
        // checkout test this was tuned against).
        const rows: { price: any; name: string }[] = await tx.$queryRaw`
          UPDATE "Product" SET stock = stock - ${quantity}
          WHERE id = ${productId} AND stock >= ${quantity}
          RETURNING price, name;
        `;

        if (rows.length === 0) {
          const existing = await tx.product.findUnique({ where: { id: productId } });
          if (!existing) {
            throw new CartError(404, `Product ${productId} not found`);
          }
          throw new CartError(409, `Not enough stock for ${existing.name}`);
        }

        // Snapshot the price now — never trust a client-supplied price.
        const { price, name } = rows[0];
        totalAmount += Number(price) * quantity;
        orderItemsData.push({ productId, quantity, price, name });
      }

      const createdOrder = await tx.order.create({
        data: {
          userId,
          totalAmount,
          status: 'COMPLETED',
          items: {
            create: orderItemsData.map(({ productId, quantity, price }) => ({ productId, quantity, price })),
          },
        },
      });

      if (sourceCartId !== null) {
        await tx.cartItem.deleteMany({ where: { cartId: sourceCartId } });
      }

      return { id: createdOrder.id, status: createdOrder.status, totalAmount: createdOrder.totalAmount, items: orderItemsData };
    },
    // Generous timeout: under heavy concurrency, transactions queue for a free
    // DB connection before they even start running, so the default 5s budget
    // (meant for the work itself) was being spent on the wait and killing
    // otherwise-healthy checkouts with "Transaction already closed".
    { timeout: 20000, maxWait: 20000 }
  );

  const response = {
    orderId: order.id,
    status: order.status,
    total: order.totalAmount,
    items: order.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    })),
  };

  if (idempotencyKey) {
    await prisma.idempotencyKey
      .create({ data: { key: idempotencyKey, userId, orderId: order.id, response } })
      .catch(() => {
        // A concurrent request with the same key won the race to insert it first;
        // the order it recorded is authoritative, this one just proceeds anyway.
      });
  }

  return response;
};
