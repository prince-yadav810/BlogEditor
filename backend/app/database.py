import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "smart_blog_editor")

# Motor client — we create one instance and reuse it.
# Motor handles connection pooling internally.
client = AsyncIOMotorClient(MONGO_URI)
db = client[DATABASE_NAME]

posts_collection = db["posts"]
