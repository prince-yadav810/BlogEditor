from fastapi import APIRouter, HTTPException
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timezone

from app.database import posts_collection
from app.models.post import PostCreate, PostUpdate, PostResponse, PostListItem

router = APIRouter(prefix="/api/posts", tags=["posts"])


def _str_id(doc: dict) -> dict:
    """Mongo returns _id as ObjectId — convert to string for Pydantic."""
    doc["_id"] = str(doc["_id"])
    return doc


@router.post("/", response_model=PostResponse, status_code=201)
async def create_post(body: PostCreate):
    now = datetime.now(timezone.utc)
    doc = {
        "title": body.title,
        "lexical_state": None,
        "plain_text": "",
        "status": "draft",
        "created_at": now,
        "updated_at": now,
    }
    result = await posts_collection.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


@router.get("/", response_model=list[PostListItem])
async def list_posts():
    """Return all posts, newest first. Only the fields the sidebar needs."""
    cursor = posts_collection.find(
        {},
        {"title": 1, "status": 1, "updated_at": 1}
    ).sort("updated_at", -1)

    posts = []
    async for doc in cursor:
        posts.append(_str_id(doc))
    return posts


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(post_id: str):
    try:
        oid = ObjectId(post_id)
    except (InvalidId, Exception):
        raise HTTPException(status_code=400, detail="Invalid post ID")

    doc = await posts_collection.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Post not found")

    return _str_id(doc)


@router.patch("/{post_id}", response_model=PostResponse)
async def update_post(post_id: str, body: PostUpdate):
    """This is the endpoint auto-save hits. Only updates the fields
    that are actually sent — the rest stays untouched."""
    try:
        oid = ObjectId(post_id)
    except (InvalidId, Exception):
        raise HTTPException(status_code=400, detail="Invalid post ID")

    update_fields = {}
    if body.title is not None:
        update_fields["title"] = body.title
    if body.lexical_state is not None:
        update_fields["lexical_state"] = body.lexical_state
    if body.plain_text is not None:
        update_fields["plain_text"] = body.plain_text

    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_fields["updated_at"] = datetime.now(timezone.utc)

    result = await posts_collection.find_one_and_update(
        {"_id": oid},
        {"$set": update_fields},
        return_document=True,
    )

    if not result:
        raise HTTPException(status_code=404, detail="Post not found")

    return _str_id(result)


@router.post("/{post_id}/publish", response_model=PostResponse)
async def publish_post(post_id: str):
    try:
        oid = ObjectId(post_id)
    except (InvalidId, Exception):
        raise HTTPException(status_code=400, detail="Invalid post ID")

    result = await posts_collection.find_one_and_update(
        {"_id": oid},
        {"$set": {
            "status": "published",
            "updated_at": datetime.now(timezone.utc),
        }},
        return_document=True,
    )

    if not result:
        raise HTTPException(status_code=404, detail="Post not found")

    return _str_id(result)
