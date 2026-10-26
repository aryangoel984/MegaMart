import api from './api';

export interface CartItem {
  productId: number;
  name: string;
  price: string;
  imageUrl?: string;
  quantity: number;
  stock: number;
  lineTotal: number;
}

export interface Cart {
  cartId?: number;
  items: CartItem[];
  subtotal: number;
}

export interface CheckoutLineInput {
  productId: number;
  quantity: number;
}

export interface CheckoutResult {
  orderId: number;
  status: string;
  total: string;
  items: { productId: number; name: string; quantity: number; price: string }[];
}

export const getCart = async (): Promise<Cart> => {
  const res = await api.get('/cart');
  return res.data;
};

export const addItem = async (productId: number, quantity: number = 1): Promise<Cart> => {
  const res = await api.post('/cart/items', { productId, quantity });
  return res.data;
};

export const updateItem = async (productId: number, quantity: number): Promise<Cart> => {
  const res = await api.patch(`/cart/items/${productId}`, { quantity });
  return res.data;
};

export const removeItem = async (productId: number): Promise<Cart> => {
  const res = await api.delete(`/cart/items/${productId}`);
  return res.data;
};

export const clearCart = async (): Promise<Cart> => {
  const res = await api.delete('/cart');
  return res.data;
};

/**
 * With no `items`, checks out (and clears) the whole stored cart. With
 * `items`, checks out exactly those lines — used by "Buy Now" so it never
 * force-purchases whatever else happens to be sitting in the cart.
 */
export const checkout = async (items?: CheckoutLineInput[]): Promise<CheckoutResult> => {
  const idempotencyKey =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  const res = await api.post(
    '/checkout',
    items ? { items } : {},
    { headers: { 'Idempotency-Key': idempotencyKey } }
  );
  return res.data.order;
};

/** Extracts a server-sent error message from an Axios error, if present. */
export const cartErrorMessage = (err: unknown, fallback: string): string => {
  const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
  return message || fallback;
};
