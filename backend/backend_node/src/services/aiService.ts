import axios from 'axios';
import prisma from '../config/db';

const DEFAULT_HF_API_URL =
  'https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction';
const DEFAULT_GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const EMBED_MAX_RETRIES = 3;
const EMBED_RETRY_DELAY_MS = 2000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const vectorNorm = (vector: number[]) =>
  Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));

/**
 * Converts text (e.g., "coding laptop") into a 384-dim vector via Hugging Face
 * (same model as before: all-MiniLM-L6-v2 — existing product vectors stay valid).
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
  const HF_API_KEY = process.env.HF_API_KEY;
  const HF_API_URL = process.env.HF_API_URL || DEFAULT_HF_API_URL;

  if (!HF_API_KEY) {
    console.error('[HF EMBEDDING] FAILED: HF_API_KEY is not set');
    return [];
  }

  for (let attempt = 1; attempt <= EMBED_MAX_RETRIES; attempt++) {
    const startedAt = Date.now();
    console.log('\n[HF EMBEDDING] Sending request');
    console.log('  provider: Hugging Face Inference');
    console.log('  model: sentence-transformers/all-MiniLM-L6-v2');
    console.log(`  input: ${JSON.stringify(text)}`);
    console.log(`  input length: ${text.length} characters`);
    console.log(`  attempt: ${attempt}/${EMBED_MAX_RETRIES}`);

    try {
      const response = await axios.post(
        HF_API_URL,
        { inputs: text },
        {
          headers: {
            Authorization: `Bearer ${HF_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        }
      );

      const data = response.data;
      let vector: number[] | null = null;

      // Single string → flat [384]; sometimes wrapped as [[384]]
      if (Array.isArray(data) && Array.isArray(data[0])) {
        vector = data[0] as number[];
      }
      if (!vector && Array.isArray(data) && typeof data[0] === 'number') {
        vector = data as number[];
      }

      if (!vector) {
        console.error('[HF EMBEDDING] FAILED: unexpected response shape:', data);
        return [];
      }

      console.log('[HF EMBEDDING] SUCCESS: Hugging Face returned a vector');
      console.log(`  HTTP status: ${response.status}`);
      console.log(`  duration: ${Date.now() - startedAt}ms`);
      console.log(`  dimensions: ${vector.length} (expected 384)`);
      console.log(`  vector norm: ${vectorNorm(vector).toFixed(6)}`);
      console.log(`  sample values: [${vector.slice(0, 5).map((v) => v.toFixed(6)).join(', ')}]`);
      console.log(`  validation: ${vector.length === 384 ? 'PASS' : 'FAIL'}\n`);
      return vector.length === 384 ? vector : [];
    } catch (error: any) {
      const status = error.response?.status;
      const isRetryable = status === 503 || status === 504 || !status;
      console.error(
        `[HF EMBEDDING] FAILED after ${Date.now() - startedAt}ms (HTTP ${status || 'network error'}):`,
        error.response?.data || error.message
      );
      if (isRetryable && attempt < EMBED_MAX_RETRIES) {
        await sleep(EMBED_RETRY_DELAY_MS * attempt);
        continue;
      }
      return [];
    }
  }
  return [];
};

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
      console.log('[HF RECOMMENDATION] Cold start: no past purchases; using latest products');
      return null;
    }
    console.log(`[HF RECOMMENDATION] Embedding ${pastPurchases.length} purchase categories`);
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
      description: 'Adds a specific product to the user\'s pending shopping cart. Requires product ID and quantity.',
      parameters: {
        type: 'object',
        properties: {
          productId: {
            type: 'integer',
            description: 'The ID of the product to add.'
          },
          quantity: {
            type: 'integer',
            description: 'The quantity of items to add. Defaults to 1.'
          }
        },
        required: ['productId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'checkoutCart',
      description: 'Completes the checkout process, converting the user\'s pending cart into a completed order.',
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
    // 1. Use the existing semantic vector generator
    const queryVector = await generateEmbedding(query);
    if (!queryVector || queryVector.length === 0) {
      // Fallback to text matching if AI embedding service fails
      const products = await prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: 3
      });
      return products.map(p => ({ ...p, similarity: 0.8 }));
    }

    const vectorString = JSON.stringify(queryVector);
    const products: any = await prisma.$queryRaw`
      SELECT id, name, description, price, "imageUrl", category, stock,
      1 - ("descriptionVector" <=> ${vectorString}::vector) as similarity
      FROM "Product"
      ORDER BY similarity DESC
      LIMIT 3;
    `;
    return products;
  } catch (error) {
    console.error('⚠️ Search catalog tool error:', error);
    return [];
  }
};

export const executeViewCart = async (userId: number): Promise<any> => {
  try {
    const pendingOrder = await prisma.order.findFirst({
      where: { userId, status: 'PENDING' },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    if (!pendingOrder || pendingOrder.items.length === 0) {
      return { message: 'Your cart is empty.', items: [], total: 0 };
    }

    return {
      orderId: pendingOrder.id,
      items: pendingOrder.items.map(item => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        imageUrl: item.product.imageUrl,
        quantity: item.quantity,
        subtotal: Number(item.product.price) * item.quantity
      })),
      total: Number(pendingOrder.totalAmount)
    };
  } catch (error) {
    console.error('⚠️ View cart tool error:', error);
    return { message: 'Failed to fetch cart.' };
  }
};

export const executeAddToCart = async (userId: number, productId: number, quantity: number = 1): Promise<any> => {
  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return { error: `Product ID ${productId} not found.` };
    }
    if (product.stock < quantity) {
      return { error: `Sorry, only ${product.stock} of ${product.name} left in stock.` };
    }

    // Run order mutation inside an ACID transaction to guarantee consistancy
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get or create PENDING order (cart)
      let pendingOrder = await tx.order.findFirst({
        where: { userId, status: 'PENDING' }
      });

      if (!pendingOrder) {
        pendingOrder = await tx.order.create({
          data: {
            userId,
            status: 'PENDING',
            totalAmount: 0
          }
        });
      }

      // 2. Add or update item
      const existingItem = await tx.orderItem.findFirst({
        where: { orderId: pendingOrder.id, productId }
      });

      if (existingItem) {
        await tx.orderItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + quantity }
        });
      } else {
        await tx.orderItem.create({
          data: {
            orderId: pendingOrder.id,
            productId,
            quantity,
            price: product.price
          }
        });
      }

      // 3. Recalculate total amount
      const allItems = await tx.orderItem.findMany({
        where: { orderId: pendingOrder.id },
        include: { product: true }
      });

      const total = allItems.reduce((acc, item) => acc + Number(item.product.price) * item.quantity, 0);

      const updatedOrder = await tx.order.update({
        where: { id: pendingOrder.id },
        data: { totalAmount: total },
        include: { items: { include: { product: true } } }
      });

      return { order: updatedOrder, product };
    });

    return {
      success: true,
      message: `Added ${quantity}x ${result.product.name} to your cart.`,
      cartTotal: result.order.totalAmount,
      addedProduct: {
        id: result.product.id,
        name: result.product.name,
        price: result.product.price,
        imageUrl: result.product.imageUrl
      }
    };
  } catch (error) {
    console.error('⚠️ Add to cart tool error:', error);
    return { error: 'Could not add product to cart.' };
  }
};

export const executeCheckoutCart = async (userId: number): Promise<any> => {
  try {
    const pendingOrder = await prisma.order.findFirst({
      where: { userId, status: 'PENDING' },
      include: { items: { include: { product: true } } }
    });

    if (!pendingOrder || pendingOrder.items.length === 0) {
      return { error: 'Your cart is empty. Nothing to checkout.' };
    }

    // Validate stocks
    for (const item of pendingOrder.items) {
      if (item.product.stock < item.quantity) {
        return { error: `Checkout failed: Not enough stock for ${item.product.name}.` };
      }
    }

    // ACID Transaction for checkout
    const result = await prisma.$transaction(async (tx) => {
      // A. Decrement stock for all items
      for (const item of pendingOrder.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });
      }

      // B. Update status to completed
      const completedOrder = await tx.order.update({
        where: { id: pendingOrder.id },
        data: { status: 'COMPLETED' },
        include: { items: { include: { product: true } } }
      });

      return completedOrder;
    });

    return {
      success: true,
      message: 'Checkout completed successfully!',
      orderId: result.id,
      total: result.totalAmount,
      items: result.items.map(i => ({ name: i.product.name, qty: i.quantity }))
    };
  } catch (error) {
    console.error('⚠️ Checkout cart tool error:', error);
    return { error: 'Checkout transaction failed.' };
  }
};

// --- MOCK NLP SERVICE FALLBACK (For Keyless Execution) ---

export const executeMockAgent = async (userId: number, userMessage: string): Promise<any> => {
  const query = userMessage.toLowerCase();
  
  // A. Checkout Intent
  if (query.includes('checkout') || query.includes('buy now') || query.includes('complete order')) {
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

  // B. Add to Cart Intent
  const addMatch = query.match(/(?:add|put|buy)\s+(?:to\s+cart\s+)?(?:a\s+|the\s+)?([a-zA-Z0-9\s"'\-]+)/i);
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
Your purpose is to assist the user in discovering products, adding them to the cart, viewing their cart, and checking out.

You have access to the following dynamic tools:
1. 'searchCatalog' (query): Search products by text/description.
2. 'viewCart' (): Look up user's active cart list & total amount.
3. 'addToCart' (productId, quantity): Add an item to the user's cart.
4. 'checkoutCart' (): Checkout the pending order.

RULES:
- When a user asks for products, ALWAYS call 'searchCatalog' and let the frontend render the cards.
- When a user asks to buy/add something, search for it first if you don't know the ID, then call 'addToCart'.
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
        model: 'qwen/qwen3.6-27b',
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