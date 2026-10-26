import { Prisma } from '@prisma/client';
import prisma from '../config/db';

export class CartError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const toCartResponse = (
  cart: { id: number; items: { productId: number; quantity: number; product: { id: number; name: string; price: Prisma.Decimal; imageUrl: string | null; stock: number } }[] } | null
) => {
  if (!cart) {
    return { items: [], subtotal: 0 };
  }

  const items = cart.items.map((item) => ({
    productId: item.product.id,
    name: item.product.name,
    price: item.product.price,
    imageUrl: item.product.imageUrl,
    quantity: item.quantity,
    stock: item.product.stock,
    lineTotal: Number(item.product.price) * item.quantity,
  }));

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  return { cartId: cart.id, items, subtotal };
};

const findCartWithItems = (userId: number) =>
  prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true }, orderBy: { id: 'asc' } } },
  });

export const getCart = async (userId: number) => {
  const cart = await findCartWithItems(userId);
  return toCartResponse(cart);
};

/**
 * Adds `quantity` of a product to the user's cart, or increases the
 * existing line if the product is already in it. Rejects when the
 * resulting total would exceed stock, so the cart can never overshoot
 * (fixes BUG-02 / BUG-05 from the MegaMart audit).
 */
export const addItem = async (userId: number, productId: number, quantity: number) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new CartError(404, `Product ${productId} not found`);
  }

  const cart = await prisma.$transaction(async (tx) => {
    const existingCart = await tx.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    const existingItem = await tx.cartItem.findUnique({
      where: { cartId_productId: { cartId: existingCart.id, productId } },
    });

    const newQuantity = (existingItem?.quantity || 0) + quantity;
    if (newQuantity > product.stock) {
      throw new CartError(
        422,
        existingItem
          ? `Only ${product.stock} of ${product.name} in stock — you already have ${existingItem.quantity} in your cart.`
          : `Only ${product.stock} of ${product.name} in stock.`
      );
    }

    await tx.cartItem.upsert({
      where: { cartId_productId: { cartId: existingCart.id, productId } },
      create: { cartId: existingCart.id, productId, quantity: newQuantity },
      update: { quantity: newQuantity },
    });

    return findCartWithItemsInTx(tx, existingCart.id);
  });

  return toCartResponse(cart);
};

// Helper used inside the transaction above (separate from the top-level
// findCartWithItems, which takes a userId and runs outside any transaction).
const findCartWithItemsInTx = (tx: Prisma.TransactionClient, cartId: number) =>
  tx.cart.findUnique({
    where: { id: cartId },
    include: { items: { include: { product: true }, orderBy: { id: 'asc' } } },
  });

/**
 * Sets a line to an exact quantity (not a delta). Used by the cart UI's
 * quantity stepper and by the agent's "set quantity to N" tool.
 */
export const updateItem = async (userId: number, productId: number, quantity: number) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) {
    throw new CartError(404, 'Your cart is empty');
  }

  const item = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
    include: { product: true },
  });
  if (!item) {
    throw new CartError(404, `Product ${productId} is not in your cart`);
  }

  if (quantity > item.product.stock) {
    throw new CartError(422, `Only ${item.product.stock} of ${item.product.name} in stock.`);
  }

  await prisma.cartItem.update({
    where: { id: item.id },
    data: { quantity },
  });

  return toCartResponse(await findCartWithItems(userId));
};

export const removeItem = async (userId: number, productId: number) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) {
    throw new CartError(404, 'Your cart is empty');
  }

  const item = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });
  if (!item) {
    throw new CartError(404, `Product ${productId} is not in your cart`);
  }

  await prisma.cartItem.delete({ where: { id: item.id } });
  return toCartResponse(await findCartWithItems(userId));
};

export const clearCart = async (userId: number) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
  return { items: [], subtotal: 0 };
};
