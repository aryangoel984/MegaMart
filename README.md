# MegaMart E-Commerce Platform

MegaMart is a modern, premium e-commerce platform architected as a set of separate microservices. It features an AI-driven personalized recommendation engine powered by vector search and sentence transformers.

## 🏗 System Architecture 

This repository is organized into a mono-repo structure containing three main services:

### 1. `frontend/` (Next.js & Tailwind)
The user-facing web application. It handles routing, user sessions, premium UI/UX interfaces (including a specialized AI dashboard), and interacts directly with the Node.js backend.
* **Tech Stack**: Next.js 16, React 19, Tailwind CSS v4, Lucide React icons.
* **Running Locally**: `cd frontend && npm run dev`

### 2. `backend/backend_node/` (Express & Prisma)
The central nervous system of MegaMart. It connects to the primary PostgreSQL database to manage users, orders, and product data. It also securely communicates with the Python AI service to generate vectors for searches and recommendations.
* **Tech Stack**: Node.js, Express, Prisma ORM, PostgreSQL (with `pgvector`).
* **Running Locally**: `cd backend/backend_node && npm run build && node dist/server.js`

### 3. `backend/backend_python/` (FastAPI & Transformers)
A dedicated, isolated Machine Learning microservice. Using HuggingFace's SentenceTransformers, this service calculates vector embeddings from product descriptions and search queries to perform Semantic Search and user recommendations.
* **Tech Stack**: Python 3, FastAPI, Uvicorn, PyTorch, Sentence-Transformers.
* **Running Locally**: `cd backend/backend_python && source venv/bin/activate && uvicorn main:app --reload --port 8000`

---

## 🚀 Getting Started

To run the entire MegaMart ecosystem locally, you will need 3 separate terminal tabs.

**Terminal 1: Start the AI Service**
```bash
cd backend/backend_python
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Terminal 2: Start the Core Backend**
```bash
cd backend/backend_node
npm install
npm run build
node dist/server.js
```

**Terminal 3: Start the Web UI**
```bash
cd frontend
npm install
npm run dev
```

Navigate to `http://localhost:3000` to interact with the platform!

## ☁️ Deployment Strategy

Due to the nature of the machine-learning dependencies and serverless constraints, deployment requires specific platform tuning:
* **Frontend**: Deploy on [Vercel](https://vercel.com/) via GitHub integration. Set root directory to `frontend` and add `NEXT_PUBLIC_API_URL` pointing to the deployed Node backend.
* **Node Backend**: Deploy via Web Service on [Render](https://render.com/). Build with `npm run build`, start with `node dist/server.js`. Expose `PYTHON_SERVICE_URL` and `FRONTEND_URL`.
* **Python Backend**: Deploy via Web Service on [Render](https://render.com/). Build via `requirements.txt`, start with `uvicorn main:app --host 0.0.0.0 --port 10000`.

## 🤖 The AI Recommendation Pipeline
When a user visits their dashboard, the Node backend gathers their past purchases and queries the Python backend. Python converts those purchases into a dense mathematical vector. Node then takes that vector and performs a Cosine Similarity Search (`<=>`) in the PostgreSQL database using `pgvector` to find products with similar vector signatures, presenting personalized results instantly!
