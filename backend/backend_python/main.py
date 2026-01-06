from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

app = FastAPI()

# 1. Load the AI Brain (This runs once when the server starts)
# We use 'all-MiniLM-L6-v2'. It's small, fast, and great for e-commerce.
print("⏳ Loading AI Model... (This might take a moment)")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("✅ AI Model Loaded!")

class EmbedRequest(BaseModel):
    text: str

class RecommendationRequest(BaseModel):
    user_id: int
    past_purchases: list

@app.get("/")
def read_root():
    return {"status": "AI Service Running"}

# 2. NEW ENDPOINT: Text -> Numbers
@app.post("/embed")
def generate_embedding(data: EmbedRequest):
    # This single line does the magic
    vector = model.encode(data.text)
    return {"vector": vector.tolist()}

# 3. OLD ENDPOINT: Keep this so your Dashboard doesn't break
@app.post("/recommend")
def get_recommendations(data: RecommendationRequest):
    # Simple logic for now (Rule-Based)
    if "Electronics" in data.past_purchases:
        return {"recommendations": [{"id": 100, "name": "Cable Organizer", "reason": "Great for your gadgets"}]}
    return {"recommendations": []}