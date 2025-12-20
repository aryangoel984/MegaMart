# backend_python/main.py
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

app = FastAPI()

# Define the Input Schema (Like TypeScript Interfaces)
class Product(BaseModel):
    id: int
    category: str

class RecommendationRequest(BaseModel):
    user_id: int
    past_purchases: List[Product]

# The "Brain" Logic (Rule-Based for now)
@app.post("/recommend")
def get_recommendations(data: RecommendationRequest):
    print(f"🧠 AI Service received request for User {data.user_id}")
    
    # Simple Logic: If they bought Electronics, recommend Accessories
    has_electronics = any(p.category == "Electronics" for p in data.past_purchases)
    
    recommendations = []
    
    if has_electronics:
        recommendations.append({
            "id": 101,
            "name": "Noise Cancelling Headphones",
            "reason": "Because you bought Electronics"
        })
        recommendations.append({
            "id": 102,
            "name": "Screen Cleaner",
            "reason": "Keep your gadgets clean"
        })
    else:
        # Default fallback
        recommendations.append({
            "id": 201,
            "name": "Best Selling T-Shirt",
            "reason": "Popular choice"
        })

    return {"recommendations": recommendations}

# Health Check
@app.get("/")
def read_root():
    return {"status": "AI Service is Running"}