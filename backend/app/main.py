import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.routes import posts, ai

load_dotenv()

app = FastAPI(
    title="Smart Blog Editor API",
    description="Backend for the Neugence internship blog editor assignment",
    version="0.1.0",
)

# CORS — dev defaults + production origins from env
_default_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
_extra = os.getenv("CORS_ORIGINS", "")
origins = _default_origins + [o.strip() for o in _extra.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(posts.router)
app.include_router(ai.router)


@app.get("/")
async def root():
    return {"status": "ok", "message": "Smart Blog Editor API"}
