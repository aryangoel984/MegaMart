import axios from 'axios';
import * as cartService from './cartService';
import { CartError } from './cartService';
import { checkout as checkoutService } from './checkoutService';
import { randomUUID } from 'crypto';
import { generateEmbedding } from './embeddingService';
import { searchProducts } from './searchService';

export { generateEmbedding };

const DEFAULT_GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Recommendation vector from past purchase categories (or null for cold start).
 * Same behavior as the old Python /recommend endpoint, now done in Node.
 */
export const getRecommendations = async (
  _userId: number,
  pastPurchases: any[]
): Promise<number[] | null> => {
  try {
    if (!pastPurchases || pastPurchases.length === 0) {
      console.log('[RECOMMENDATION] Cold start: no past purchases; using latest products');
      return null;
    }
    console.log(`[RECOMMENDATION] Embedding ${pastPurchases.length} purchase categories`);
    const vector = await generateEmbedding(pastPurchases.join(' '));
    return vector.length > 0 ? vector : null;
  } catch (error: any) {
    console.error('⚠️ AI Recommendation Error:', error.message);
    return null;
  }
};

// 1. Tool Schemas for Groq function calling
const tools = [
  {
    type: 'function',
    function: {
      name: 'searchCatalog',
      description: 'Searches the product catalog using natural language description. Returns a list of matching products.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search term or description of the product, e.g. "coding laptop" or "sneakers".'
          }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'viewCart',
      description: 'Retrieves the current pending cart items and total cost for the user.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'addToCart',
      description: 'Adds a specific product to the user\'s shopping cart. Requires product ID and quantity.',
      parameters: {
        type: 'object',
        properties: {
          productId: {
            type: 'integer',
            description: 'The ID of the product to add.'
          },
          quantity: {
            type: 'integer',
            description: 'The quantity of items to add. Defaults to 1. Must be a positive whole number.'
          }
        },
        required: ['productId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'updateCartItem',
      description: 'Sets a cart line to an exact quantity (not a delta). Use this for "set quantity to N" or "change X to N" requests.',
      parameters: {
        type: 'object',
        properties: {
          productId: { type: 'integer', description: 'The ID of the product already in the cart.' },
          quantity: { type: 'integer', description: 'The exact quantity the line should be set to.' }
        },
        required: ['productId', 'quantity']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'removeFromCart',
      description: 'Removes a single product entirely from the user\'s cart.',
      parameters: {
        type: 'object',
        properties: {
          productId: { type: 'integer', description: 'The ID of the product to remove.' }
        },
        required: ['productId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'clearCart',
      description: 'Empties the user\'s entire cart. Use for "clear my cart" or "empty my cart" requests.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'checkoutCart',
      description: 'Completes the checkout process, converting the user\'s cart into a placed order.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  }
];

// --- TOOL DATABASE EXECUTORS ---

export const executeSearchCatalog = async (query: string): Promise<any> => {
  try {
    return await searchProducts(query, 3);
  } catch (error) {
    console.error('⚠️ Search catalog tool error:', error);
    return [];
  }
};

// Below, every cart/checkout tool delegates to the same cartService /
// checkoutService used by the REST API (src/controllers/cartController.ts,
// checkoutController.ts), so the agent and the UI can never drift apart on
// stock validation, pricing or what "the cart" actually contains.

const cartToViewPayload = (cart: Awaited<ReturnType<typeof cartService.getCart>>) => ({
  items: cart.items.map((item) => ({
    id: item.productId,
    name: item.name,
    price: item.price,
    imageUrl: item.imageUrl,
    quantity: item.quantity,
    subtotal: item.lineTotal
  })),
  total: cart.subtotal
});

export const executeViewCart = async (userId: number): Promise<any> => {
  try {
    const cart = await cartService.getCart(userId);
    if (cart.items.length === 0) {
      return { message: 'Your cart is empty.', items: [], total: 0 };
    }
    return cartToViewPayload(cart);
  } catch (error) {
    console.error('⚠️ View cart tool error:', error);
    return { message: 'Failed to fetch cart.' };
  }
};

export const executeAddToCart = async (userId: number, productId: number, quantity: number = 1): Promise<any> => {
  if (!Number.isInteger(quantity) || quantity < 1) {
    return { error: 'Quantity must be a positive whole number.' };
  }
  try {
    const cart = await cartService.addItem(userId, productId, quantity);
    const addedProduct = cart.items.find((item) => item.productId === productId);
    return {
      success: true,
      message: `Added ${quantity}x ${addedProduct?.name ?? `product ${productId}`} to your cart.`,
      cartTotal: cart.subtotal,
      addedProduct: addedProduct && {
        id: addedProduct.productId,
        name: addedProduct.name,
        price: addedProduct.price,
        imageUrl: addedProduct.imageUrl
      }
    };
  } catch (error) {
    if (error instanceof CartError) {
      return { error: error.message };
    }
    console.error('⚠️ Add to cart tool error:', error);
    return { error: 'Could not add product to cart.' };
  }
};

export const executeUpdateCartItem = async (userId: number, productId: number, quantity: number): Promise<any> => {
  if (!Number.isInteger(quantity) || quantity < 1) {
    return { error: 'Quantity must be a positive whole number. Use removeFromCart to take an item out entirely.' };
  }
  try {
    const cart = await cartService.updateItem(userId, productId, quantity);
    return { success: true, message: `Updated quantity to ${quantity}.`, cart: cartToViewPayload(cart) };
  } catch (error) {
    if (error instanceof CartError) {
      return { error: error.message };
    }
    console.error('⚠️ Update cart item tool error:', error);
    return { error: 'Could not update that cart item.' };
  }
};

export const executeRemoveFromCart = async (userId: number, productId: number): Promise<any> => {
  try {
    const cart = await cartService.removeItem(userId, productId);
    return { success: true, message: 'Removed item from your cart.', cart: cartToViewPayload(cart) };
  } catch (error) {
    if (error instanceof CartError) {
      return { error: error.message };
    }
    console.error('⚠️ Remove from cart tool error:', error);
    return { error: 'Could not remove that item.' };
  }
};

export const executeClearCart = async (userId: number): Promise<any> => {
  try {
    await cartService.clearCart(userId);
    return { success: true, message: 'Your cart is now empty.' };
  } catch (error) {
    console.error('⚠️ Clear cart tool error:', error);
    return { error: 'Could not clear your cart.' };
  }
};

export const executeCheckoutCart = async (userId: number): Promise<any> => {
  try {
    const order = await checkoutService(userId, undefined, `agent-${userId}-${randomUUID()}`);
    return {
      success: true,
      message: 'Checkout completed successfully!',
      orderId: order.orderId,
      total: order.total,
      items: order.items.map((i: { name: string; quantity: number }) => ({ name: i.name, qty: i.quantity }))
    };
  } catch (error) {
    if (error instanceof CartError) {
      return { error: error.message };
    }
    console.error('⚠️ Checkout cart tool error:', error);
    return { error: 'Checkout transaction failed.' };
  }
};

// --- MOCK NLP SERVICE FALLBACK (For Keyless Execution) ---

/**
 * Handles the exact, unambiguous commands the frontend's buttons send
 * (e.g. "Add 1x of product ID 9 to my cart", "checkout my cart") directly
 * against the database, bypassing both the regex-heuristic mock agent and
 * the Groq LLM. Button-driven actions shouldn't depend on an LLM correctly
 * guessing intent from wording (Groq occasionally read "checkout my cart"
 * as a request to view the cart) or on fuzzy catalog search being healthy.
 * Returns null when the message isn't one of these known commands, so the
 * caller can fall through to free-text handling.
 */
export const tryDeterministicIntent = async (userId: number, userMessage: string): Promise<any | null> => {
  const query = userMessage.toLowerCase();

  // Explicit Clear/Empty Cart Intent (sent by the cart UI's "Clear cart" button)
  if (/^(clear|empty)\s+(my\s+|the\s+)?(cart|bag)\b/.test(query)) {
    const res = await executeClearCart(userId);
    return {
      content: res.error ? `⚠️ ${res.error}` : `🗑️ ${res.message}`,
      toolCalled: 'clearCart',
      toolResult: res
    };
  }

  const productIdMatch = query.match(/product\s*id\s*(\d+)/i);

  // Explicit Remove Intent (sent by the cart UI's trash icon)
  if (productIdMatch && /\b(remove|delete)\b/.test(query)) {
    const productId = parseInt(productIdMatch[1], 10);
    const res = await executeRemoveFromCart(userId, productId);
    return {
      content: res.error ? `⚠️ ${res.error}` : `🗑️ ${res.message}`,
      toolCalled: 'removeFromCart',
      toolResult: res
    };
  }

  // Explicit Set-Quantity Intent (sent by the cart UI's quantity stepper)
  const setQtyMatch = query.match(/set\s+quantity\s+to\s*(-?\d+)/i);
  if (productIdMatch && setQtyMatch) {
    const productId = parseInt(productIdMatch[1], 10);
    const quantity = parseInt(setQtyMatch[1], 10);
    const res = await executeUpdateCartItem(userId, productId, quantity);
    return {
      content: res.error ? `⚠️ ${res.error}` : `✅ ${res.message}`,
      toolCalled: 'updateCartItem',
      toolResult: res
    };
  }

  // Explicit "product ID <n>" Add Intent (sent by the frontend's Add/Buy buttons).
  // The quantity capture allows a leading minus sign so "Add -5x…" resolves to
  // quantity -5 and gets rejected by executeAddToCart's validation, rather than
  // silently losing the sign and adding a positive 5 (the original BUG-05).
  if (productIdMatch) {
    const productId = parseInt(productIdMatch[1], 10);
    const qtyMatch = query.match(/(-?\d+)\s*x\b/i);
    const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
    const res = await executeAddToCart(userId, productId, quantity);
    if (res.error) {
      return { content: `⚠️ ${res.error}`, toolCalled: 'addToCart', toolResult: res };
    }
    return {
      content: `🛒 Added ${quantity}x **${res.addedProduct.name}** ($${res.addedProduct.price}) to your cart. Your updated total is **$${res.cartTotal}**.`,
      toolCalled: 'addToCart',
      toolResult: res
    };
  }

  // Explicit Checkout Intent (sent by the frontend's checkout buttons).
  // Matched only at the start of the message so a genuine question like
  // "what happens after I checkout?" still goes to the LLM instead of
  // triggering a real purchase.
  if (/^(checkout|buy now|complete order)\b/.test(query)) {
    const res = await executeCheckoutCart(userId);
    if (res.error) {
      return { content: `⚠️ ${res.error}`, toolCalled: 'checkoutCart', toolResult: res };
    }
    return {
      content: `🎉 Excellent! Your checkout is complete. I've placed **Order #${res.orderId}** for a total of **$${res.total}**. Your items are prepared for shipping!`,
      toolCalled: 'checkoutCart',
      toolResult: res
    };
  }

  return null;
};

/**
 * Resolves a free-text item reference ("the jacket", "sony headphones") to a
 * productId already sitting in the user's cart, by substring match on name.
 * Returns null (with a helpful message) when it can't resolve unambiguously.
 */
const resolveCartItemByName = (cart: { items: { id: number; name: string }[] }, phrase: string) => {
  const needle = phrase.trim().toLowerCase();
  if (!needle) return null;
  const matches = cart.items.filter((item) => item.name.toLowerCase().includes(needle));
  return matches.length === 1 ? matches[0] : null;
};

export const executeMockAgent = async (userId: number, userMessage: string): Promise<any> => {
  const query = userMessage.toLowerCase();

  const deterministic = await tryDeterministicIntent(userId, userMessage);
  if (deterministic) return deterministic;

  // Free-text Clear Cart Intent (e.g. "please empty my cart")
  if (/\b(empty|clear)\b.*\b(cart|bag)\b/.test(query)) {
    const res = await executeClearCart(userId);
    return { content: res.error ? `⚠️ ${res.error}` : `🗑️ ${res.message}`, toolCalled: 'clearCart', toolResult: res };
  }

  // Free-text Remove Intent (e.g. "remove the puffer jacket from my cart")
  const removeMatch = query.match(/\bremove\b\s+(?:the\s+)?(.+?)\s+(?:from|out of)\s+(?:my\s+|the\s+)?(?:cart|bag)\b/i);
  if (removeMatch) {
    const cart = await executeViewCart(userId);
    const target = resolveCartItemByName(cart, removeMatch[1]);
    if (!target) {
      return { content: `I couldn't find a single matching item in your cart for "${removeMatch[1].trim()}". Try "show my cart" to see exact names.`, toolCalled: 'viewCart', toolResult: cart };
    }
    const res = await executeRemoveFromCart(userId, target.id);
    return { content: res.error ? `⚠️ ${res.error}` : `🗑️ ${res.message}`, toolCalled: 'removeFromCart', toolResult: res };
  }

  // Free-text Set-Quantity Intent (e.g. "set quantity to 1")
  const setQtyFreeMatch = query.match(/set\s+(?:the\s+)?quantity\s+to\s*(-?\d+)/i);
  if (setQtyFreeMatch) {
    const quantity = parseInt(setQtyFreeMatch[1], 10);
    const cart = await executeViewCart(userId);
    if (cart.items.length === 0) {
      return { content: "Your cart is empty, so there's nothing to update.", toolCalled: 'viewCart', toolResult: cart };
    }
    if (cart.items.length > 1) {
      return { content: `Which item would you like to set to ${quantity}? You have: ${cart.items.map((i: any) => i.name).join(', ')}.`, toolCalled: 'viewCart', toolResult: cart };
    }
    const res = await executeUpdateCartItem(userId, cart.items[0].id, quantity);
    return { content: res.error ? `⚠️ ${res.error}` : `✅ ${res.message}`, toolCalled: 'updateCartItem', toolResult: res };
  }

  // B2. Free-text Add to Cart Intent (e.g. "add a laptop to my cart")
  const addMatch = query.match(/(?:add|put|buy)\s+(?:to\s+cart\s+)?(?:a\s+|the\s+)?([a-zA-Z0-9\s"'\-]+?)(?:\s+(?:to|in)\s+(?:my\s+|the\s+)?(?:cart|bag))?$/i);
  if (addMatch) {
    const searchName = addMatch[1].trim();
    // Find item
    const products = await executeSearchCatalog(searchName);
    if (products.length > 0) {
      const match = products[0];
      const res = await executeAddToCart(userId, match.id, 1);
      if (res.error) {
        return { content: `⚠️ ${res.error}`, toolCalled: 'addToCart', toolResult: res };
      }
      return {
        content: `🛒 I have added **${match.name}** ($${match.price}) to your cart. Your updated total is **$${res.cartTotal}**. Let me know if you are ready to checkout!`,
        toolCalled: 'addToCart',
        toolResult: res
      };
    }
    // Resolve definitively here instead of falling through to View Cart below,
    // which previously masked failed adds with a misleading "cart is empty" message.
    return {
      content: `I couldn't find "${searchName}" in our catalog. Can you try describing it differently?`,
      products: []
    };
  }

  // C. View Cart Intent
  if (query.includes('cart') || query.includes('bag') || query.includes('what did i add')) {
    const cart = await executeViewCart(userId);
    if (cart.items.length === 0) {
      return { content: "Your cart is currently empty! Feel free to describe what you're looking for, and I can add items for you.", toolCalled: 'viewCart', toolResult: cart };
    }
    const itemList = cart.items.map((i: any) => `- **${i.name}** (x${i.quantity}) - $${i.subtotal}`).join('\n');
    return {
      content: `📦 Here is your active shopping cart:\n\n${itemList}\n\n**Total: $${cart.total.toFixed(2)}**\n\nWould you like to complete checkout now?`,
      toolCalled: 'viewCart',
      toolResult: cart
    };
  }

  // D. Search / Catalog Intent
  const products = await executeSearchCatalog(userMessage);
  if (products.length === 0) {
    return {
      content: "I couldn't find any products in the catalog matching that description. Can you try describing it differently?",
      products: []
    };
  }

  return {
    content: `🔍 Here are the best matches I curated from our inventory based on your request:`,
    products,
    toolCalled: 'searchCatalog',
    toolResult: products
  };
};

// --- ACTIVE SERVICE ENTRYPOINT ---

export const askAgent = async (userId: number, message: string, chatHistory: any[]): Promise<any> => {
  // Known, exact commands from the frontend's own buttons are resolved deterministically
  // so they never depend on the LLM correctly inferring intent from wording.
  const deterministic = await tryDeterministicIntent(userId, message);
  if (deterministic) return deterministic;

  const GROQ_KEY = process.env.GROQ_API_KEY;
  const GROQ_URL = process.env.GROQ_URL || DEFAULT_GROQ_URL;

  // If no Groq Key, fall back to high-fidelity simulated agent
  if (!GROQ_KEY) {
    console.log("ℹ️ No GROQ_API_KEY detected. Utilizing mock fallback agent.");
    return await executeMockAgent(userId, message);
  }

  try {
    // Build context with System Prompt
    const systemPrompt = `You are MegaMart's premium AI Shopping Concierge (2026 Edition).
Your purpose is to assist the user in discovering products, managing their cart, and checking out.

You have access to the following dynamic tools:
1. 'searchCatalog' (query): Search products by text/description.
2. 'viewCart' (): Look up user's active cart list & total amount.
3. 'addToCart' (productId, quantity): Add an item to the user's cart.
4. 'updateCartItem' (productId, quantity): Set a cart line to an exact quantity.
5. 'removeFromCart' (productId): Remove a single item from the cart entirely.
6. 'clearCart' (): Empty the whole cart.
7. 'checkoutCart' (): Checkout the cart.

RULES:
- When a user asks for products, ALWAYS call 'searchCatalog' and let the frontend render the cards.
- When a user asks to buy/add something, search for it first if you don't know the ID, then call 'addToCart'.
- If you don't know a product's ID for a remove/update request, call 'viewCart' first to look it up.
- Never invent a quantity below 1 or silently flip a negative quantity positive — if the user's requested quantity isn't a positive whole number, tell them it's invalid instead of calling a tool.
- RENDER product options nicely, and suggest checking out when they are ready.
- Keep responses concise and engaging.`;

    const apiHistory = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message }
    ];

    // 1. Call Groq
    const response = await axios.post(
      GROQ_URL,
      {
        model: 'openai/gpt-oss-120b',
        messages: apiHistory,
        tools,
        tool_choice: 'auto'
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const choice = response.data.choices[0].message;

    // 2. Handle Tool Calls
    if (choice.tool_calls && choice.tool_calls.length > 0) {
      const toolCall = choice.tool_calls[0];
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      let toolResult: any;
      console.log(`🤖 Agent executing tool: ${functionName} with args:`, args);

      if (functionName === 'searchCatalog') {
        toolResult = await executeSearchCatalog(args.query);
        // Include products in the return payload so frontend can display cards
        return {
          content: `🔍 I searched our catalog for "${args.query}" and found these matches:`,
          products: toolResult,
          toolCalled: 'searchCatalog',
          toolResult
        };
      } 
      
      if (functionName === 'viewCart') {
        toolResult = await executeViewCart(userId);
        const listStr = toolResult.items.length === 0 
          ? "empty" 
          : toolResult.items.map((i: any) => `${i.name} (x${i.quantity})`).join(', ');
        
        return {
          content: toolResult.items.length === 0
            ? "Your cart is currently empty! Let me know if you would like me to find some products to add."
            : `🛒 You currently have: ${listStr}. Total amount: **$${toolResult.total}**.`,
          toolCalled: 'viewCart',
          toolResult
        };
      } 
      
      if (functionName === 'addToCart') {
        toolResult = await executeAddToCart(userId, args.productId, args.quantity || 1);
        if (toolResult.error) {
          return { content: `⚠️ ${toolResult.error}`, toolCalled: 'addToCart', toolResult };
        }
        return {
          content: `🛒 Success! I've added **${toolResult.addedProduct.name}** to your cart. Current cart total: **$${toolResult.cartTotal}**.`,
          toolCalled: 'addToCart',
          toolResult
        };
      }

      if (functionName === 'updateCartItem') {
        toolResult = await executeUpdateCartItem(userId, args.productId, args.quantity);
        return {
          content: toolResult.error ? `⚠️ ${toolResult.error}` : `✅ ${toolResult.message}`,
          toolCalled: 'updateCartItem',
          toolResult
        };
      }

      if (functionName === 'removeFromCart') {
        toolResult = await executeRemoveFromCart(userId, args.productId);
        return {
          content: toolResult.error ? `⚠️ ${toolResult.error}` : `🗑️ ${toolResult.message}`,
          toolCalled: 'removeFromCart',
          toolResult
        };
      }

      if (functionName === 'clearCart') {
        toolResult = await executeClearCart(userId);
        return {
          content: toolResult.error ? `⚠️ ${toolResult.error}` : `🗑️ ${toolResult.message}`,
          toolCalled: 'clearCart',
          toolResult
        };
      }

      if (functionName === 'checkoutCart') {
        toolResult = await executeCheckoutCart(userId);
        if (toolResult.error) {
          return { content: `⚠️ ${toolResult.error}`, toolCalled: 'checkoutCart', toolResult };
        }
        return {
          content: `🎉 Congratulations! Your checkout is complete. I've placed **Order #${toolResult.orderId}** for a total of **$${toolResult.total}**.`,
          toolCalled: 'checkoutCart',
          toolResult
        };
      }
    }

    // 3. Fallback standard message
    return {
      content: choice.content,
      products: []
    };

  } catch (error: any) {
    console.error('⚠️ Groq API connection error:', error.response?.data || error.message);
    // Fall back gracefully to mock executor
    return await executeMockAgent(userId, message);
  }
};