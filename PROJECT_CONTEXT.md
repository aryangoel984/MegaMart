# PROJECT CONTEXT: MEGAMART PLATFORM HANDOVER

This document provides a comprehensive technical overview of the MegaMart platform to facilitate seamless handover and onboarding for future development (e.g., using Claude).

---

## 1. Project Overview & Business Goal
MegaMart is a technical-showcase e-commerce application that combines standard shopping card workflows (User Authentication, Catalog Browsing, Order Management, ACID Transactions) with AI capabilities:
1. **Semantic Search:** Understanding natural language intent (e.g., "warm clothing for run") rather than strictly indexing keyword matches.
2. **Personalization / Cold-Start Recommendations:** Utilizing purchase histories to calculate embedding matches for user preferences, with a robust fallback to latest/trending products for new accounts.
3. **AI Concierge Agent:** An interactive, conversational chat widget powered by LLMs (Qwen 3.6 on Groq) with function-calling support to search products, view cart items, add items, and complete checkouts.

---

## 2. Overall System Architecture

The platform uses a split-microservices architecture built to separate high-frequency client/DB queries (Node.js) from memory-intensive model inference (Python):

```
                       +-----------------------------+
                       |   Next.js 15 Web Client     |
                       | (React 19, Tailwind CSS V4) |
                       +--------------+--------------+
                                      |
                                      | HTTP / JSON Requests
                                      v
                       +--------------+--------------+
                       |      Node.js Backend        |
                       |   (Express + TypeScript)    |
                       +-------+--------------+------+
                               |              |
           Database operations |              | HTTP REST requests
           (Prisma / Raw SQL)  |              |
                               v              v
      +------------------------+---+      +---+-------------------------+
      |        PostgreSQL          |      |     Python AI Service       |
      |   (Neon + pgvector ext)    |      |     (FastAPI + Uvicorn)     |
      +----------------------------+      +-------------+---------------+
                                                        |
                                                        | Local Model Loading
                                                        v
                                          +-------------+---------------+
                                          |   SentenceTransformer       |
                                          |     (all-MiniLM-L6-v2)      |
                                          +-----------------------------+
```

1. **Next.js Client (Port 3001):** Renders UI, coordinates user sessions, handles chat visual elements, and accesses the Node.js API client.
2. **Node.js Express Backend (Port 3000):** Acts as the orchestrator. It controls application routing, state logic, session authorizations, database modifications, and calls out to Groq (for AI Agent tasks) or the Python microservice (for vector calculations).
3. **Python AI Service (Port 8000):** A lightweight FastAPI wrapper. It loads the `all-MiniLM-L6-v2` embedding model at startup and outputs 384-dimensional floating-point vectors.
4. **PostgreSQL Database:** Powered by Neon, containing user profiles and sales histories. Leverages the `pgvector` extension to perform cosine distance calculations on high-dimensional vectors.

---

## 3. Directory Layout & Folder Purpose

### `/frontend` (Next.js Application)
* **`app/`**: Next.js App Router folders representing views:
  * **`app/page.tsx`**: Landing screen explaining the technical stack.
  * **`app/login/` & `app/register/`**: Unified auth forms with custom icons and focus borders.
  * **`app/dashboard/page.tsx`**: User cockpit, presenting lifetime counts and AI recommendations.
  * **`app/products/`**: Store catalog list showing dynamic specs, ratings, and active slide cart drawer.
  * **`app/chat/page.tsx`**: High-fidelity AI shopping assistant chat interface.
  * **`app/orders/page.tsx`**: Visual grid detailing completed purchases.
* **`utils/api.ts`**: Axios instance initialized with the backend URL, using request interceptors to inject JWT `Authorization: Bearer <token>` headers.

### `/backend/backend_node` (Express Server)
* **`src/app.ts` & `src/server.ts`**: App bootstrapping, middleware registration, CORS configurations, and listener loops.
* **`src/config/db.ts`**: Instantiates global `PrismaClient` reference.
* **`src/middlewares/authMiddleware.ts`**: Verification filters for request JWT validations.
* **`src/routes/`**: Routes mapping to specific controllers (e.g., `authRoutes.ts`, `chatRoutes.ts`, `orderRoutes.ts`).
* **`src/controllers/`**: Core logic handlers:
  * **`productController.ts`**: Details specifications and reviews dynamically compiled by category.
  * **`dashboardController.ts`**: Formulates user profile highlights and handles cold-start rec logic.
  * **`orderController.ts`**: Controls order placements.
  * **`chatController.ts`**: Receives messages and executes agent calls.
* **`src/services/aiService.ts`**: Direct interaction with the Groq API and Python service. Defines the agent's system prompt, tools, function executing behaviors, and mock fallback routines.
* **`prisma/`**: 
  * **`schema.prisma`**: Relational model configurations and `pgvector` extension declarations.
  * **`seed.ts`**: populates the database with products.
  * **`update_vectors.ts`**: Computes description embeddings using the Python microservice and updates products via raw SQL injections.

### `/backend/backend_python` (AI Service)
* **`main.py`**: Declares FastAPI routes (`/embed`, `/recommend`) and initiates `SentenceTransformer` cache operations.
* **`requirements.txt`**: Standard dependencies (`fastapi`, `uvicorn`, `sentence-transformers`, `torch`).

---

## 4. Key Functions & Systems Interaction

### Vector Search Engine
1. **`generateEmbedding(text)`** *(Node: `src/services/aiService.ts`)*: Requests a vector representation from the Python service `POST /embed`.
2. **`executeSearchCatalog(query)`** *(Node: `src/services/aiService.ts`)*: Invokes `generateEmbedding(query)`, converts the resulting floats to a string representation, and runs a raw similarity search in Postgres:
   ```sql
   SELECT id, name, price, 1 - ("descriptionVector" <=> ${vectorString}::vector) as similarity
   FROM "Product"
   ORDER BY similarity DESC LIMIT 3;
   ```

### AI Recommendation Loop (Dashboard)
1. **`getDashboard(req, res)`** *(Node: `src/controllers/dashboardController.ts`)*:
   * Maps category fields of past user orders into a flat string list: `["Electronics", "Clothing"]`.
   * Sends categories to Python `POST /recommend`.
   * **If history exists:** Python encodes categories into a preference vector. Node executes a raw similarity query on `Product` to get personalized recommendations.
   * **If cold-start (no history):** Python returns `vector: null`. Node falls back to querying the latest product entries.

### AI Shopping Concierge & Tool Orchestration
1. **`askAgent(userId, message, chatHistory)`** *(Node: `src/services/aiService.ts`)*:
   * Connects to Groq `POST https://api.groq.com/openai/v1/chat/completions` using the model **`qwen/qwen3.6-27b`**.
   * Employs system prompt constraints and function tools.
   * If Groq returns a `tool_calls` request:
     * Evaluates tool type (e.g. `searchCatalog`, `viewCart`, `addToCart`, `checkoutCart`).
     * Runs corresponding executor function in Node (e.g. `executeAddToCart`).
     * Returns results to frontend inside structured payloads so product lists or cart indicators render on the fly.
   * If `GROQ_API_KEY` is not present, falls back gracefully to **`executeMockAgent()`** matching keywords via regex.

---

## 5. Main Execution Flows

### A. Startup Sequence
1. **Database:** Postgres must have the `vector` extension loaded.
2. **Python:** FastAPI loads `all-MiniLM-L6-v2` into CPU/GPU memory, exposing port 8000.
3. **Database Seeding & Backfill:**
   * Run `npx prisma db push` to load tables.
   * Run `npm run seed` to load mock catalog items.
   * Run `npm run update-vectors` to populate `descriptionVector` coordinates in Postgres.
4. **Node Server:** Starts Express on port 3000.
5. **Next.js Client:** Launches development server on port 3001.

### B. Checkout Transaction Flow
When a user clicks "Complete Checkout" (or the AI Concierge executes `checkoutCart`):
1. **Validation:** Checks if order contains items and that inventory levels satisfy requested quantities.
2. **Prisma Transaction:** Runs an ACID transaction (`prisma.$transaction`):
   * Loops through cart items and issues `decrement` database commands on `Product.stock`.
   * Sets `Order.status = "COMPLETED"`.
   * Returns transaction status safely or aborts entire operation on check failures (such as mid-execution stock depletion).

---

## 6. Core Dependencies & Environment Configurations

### Backend Node.js
* **`prisma` / `@prisma/client`**: ORM mapping. Note the use of `previewFeatures = ["postgresqlExtensions"]` to allow vector extension setups.
* **`jsonwebtoken` & `bcrypt` / `bcryptjs`**: Security utilities.
* **`axios`**: Microservice API integrations.

### Environment variables (`backend/backend_node/.env`):
* `DATABASE_URL`: Connection pool URL for general API queries.
* `DIRECT_URL`: Direct link to PostgreSQL for running migrations.
* `JWT_SECRET`: Signature key for encoding authorization tokens.
* `PYTHON_SERVICE_URL`: Address of the Python AI API (`http://localhost:8000`).
* `FRONTEND_URL`: CORS configuration address (`http://localhost:3001`).
* `GROQ_API_KEY`: Groq API Access token.

---

## 7. Known Issues, Limitations & Areas for Development

1. **Similarity Score Thresholds:** In `executeSearchCatalog` and `dashboardController.ts`, products are returned sorted by similarity without a minimum cutoff. A search query for "shoes" can return high-ranking matching items first, but might still output unrelated electronic goods if limit bounds aren't full. Calibration is needed (e.g. `WHERE similarity > 0.6`).
2. **Hardcoded URLs in Scripts:** The file [update_vectors.ts](file:///Users/aryangoel/Desktop/PLACEMENTS/MegaMart/backend/backend_node/prisma/update_vectors.ts) hardcodes `http://localhost:8000/embed`. It should be refactored to read from `process.env.PYTHON_SERVICE_URL` to prevent vector updates from failing in production.
3. **Empty Service Files:** Folders `/services/recommendationService.ts` and `/services/orderService.ts` are initialized but empty. Business logic for DB mutations currently resides directly inside `dashboardController.ts` and `orderController.ts`. Moving this logic out will improve readability and structure.
4. **Chat Context Limits:** The chat history list grows indefinitely in memory during chat sessions. It should be capped or pruned (e.g., keeping only the last 10 messages) before sending payloads to Groq to avoid token size or cost overruns.
5. **No Image Uploads:** Images in `seed.ts` reference mock `placehold.co` links. Real projects will require file upload pipelines (e.g., AWS S3, Cloudinary) or manual image attachments on product models.
