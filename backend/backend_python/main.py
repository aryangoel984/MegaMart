from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import random

app = FastAPI()

# 1. Load AI Model
print("⏳ Loading AI Model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("✅ AI Model Loaded!")

class EmbedRequest(BaseModel):
    text: str

class RecommendationRequest(BaseModel):
    user_id: int
    past_purchases: list[str] # Expecting a list of categories e.g. ["Electronics", "Clothing"]

# --- DATA: Mocking a "Best Sellers" list ---
# In a real app, this would come from the database (e.g., "Top 3 most sold items")
TRENDING_PRODUCTS = [
    {"id": 1, "name": "MacBook Pro 14\"", "reason": "🔥 Trending in Tech"},
    {"id": 4, "name": "Levis 501 Jeans", "reason": "👕 Best Seller in Fashion"},
    {"id": 3, "name": "Sony WH-1000XM5", "reason": "🎧 Top Rated Audio Gear"}
]

# --- DATA: Smart Rules (Category -> Recommendation) ---
CATEGORY_RULES = {
    "Electronics": [
        {"id": 2, "name": "iPhone 15 Pro", "reason": "Since you like Tech"},
        {"id": 4, "name": "Logitech MX Master", "reason": "Upgrade your setup"}
    ],
    "Clothing": [
        {"id": 5, "name": "Adidas Ultraboost", "reason": "Complete your outfit"},
        {"id": 6, "name": "Nike Dri-Fit Tee", "reason": "Popular in Sportswear"}
    ],
    "Footwear": [
        {"id": 4, "name": "Levis 501 Jeans", "reason": "Matches your shoes"}
    ]
}

@app.get("/")
def read_root():
    return {"status": "AI Service Running"}

@app.post("/embed")
def generate_embedding(data: EmbedRequest):
    vector = model.encode(data.text)
    return {"vector": vector.tolist()}

@app.post("/recommend")
def get_recommendations(data: RecommendationRequest):
    # SCENARIO 1: The "Cold Start" (No history)
    # Return null vector so backend knows to fetch generic popular items
    if not data.past_purchases:
        return {"vector": None}

    # SCENARIO 2: Context-Aware Embedding
    # Combine categories to form a query vector
    # e.g. "Electronics Clothing" -> Vector
    combined_text = " ".join(data.past_purchases)
    vector = model.encode(combined_text)
    
    return {"vector": vector.tolist()}