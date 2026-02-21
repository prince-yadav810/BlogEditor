# Smart Blog Editor

A full-stack blog editor with Lexical rich-text editing, auto-save, and AI-powered summarisation and grammar correction via DeepSeek. Built as an internship assignment for Neugence.

**Stack:** React 19 + Lexical + Zustand · FastAPI + Motor (MongoDB) · DeepSeek streaming via OpenAI SDK

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| Python | ≥ 3.11 |
| MongoDB | Local (`mongod`) or Atlas connection string |

---

## Setup

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file (copy from `.env.example`):

```
MONGO_URI=mongodb://localhost:27017
DATABASE_NAME=smart_blog_editor
DEEPSEEK_API_KEY=sk-your-key-here
```

`MONGO_URI` can be a local MongoDB or an Atlas connection string.  
`DEEPSEEK_API_KEY` — get one from [platform.deepseek.com](https://platform.deepseek.com).

Start the server:

```bash
uvicorn app.main:app --reload --port 8000
```

API docs are at [http://localhost:8000/docs](http://localhost:8000/docs).

### 2. Frontend

```bash
cd frontend
npm install
```

Create a `.env` file:

```
VITE_API_URL=http://localhost:8000
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## How auto-save works

The auto-save system has three pieces:

### 1. Closure-based debounce (`lib/debounce.js`)

```js
export default function debounce(fn, delay) {
    let timer                      // closed-over — survives between calls
    return (...args) => {
        clearTimeout(timer)        // cancel any pending invocation
        timer = setTimeout(() => fn(...args), delay)
    }
}
```

The debounce function returns a **new function** that shares a single `timer` variable via closure. Every call clears the previous timer and starts a fresh one. This collapses rapid keystrokes into a single save — only the last call within `delay` ms actually fires.

We use **2 seconds** because it balances data safety (short enough to capture recent edits) against network efficiency (not saving on every keystroke). Medium uses a similar interval.

### 2. Save status state machine (`useAutoSave.js`)

The save process follows a strict 5-state machine:

```
idle → pending → saving → saved → idle
                       ↘ error
```

| State | Meaning | UI |
|-------|---------|------|
| `idle` | No changes since last save | Nothing shown |
| `pending` | Content changed, waiting for debounce | Grey dot |
| `saving` | Network request in flight | "Saving..." |
| `saved` | Server confirmed, fades after 3s | "Saved ✓" |
| `error` | Request failed | "Save failed · Retry" |

The hook watches Zustand's `lexicalState` via a `useRef` diff. When it changes, the status is immediately set to `pending` (synchronous, before the debounced save fires). This means the user **always** sees `pending` → `saving` → `saved` — there's no frame where they think content is saved when it isn't.

### 3. Auto-create draft

If there's no `activePostId` in the store, the first save automatically calls `POST /api/posts/` to create a new draft, then saves the content to it. The user never sees a "create post" button — they just start typing.

---

## Database schema

### Why MongoDB

Lexical's editor state is a **deeply nested JSON tree** (nodes, children, formatting flags). Storing this in a relational database would mean either:
- Stringifying it (losing queryability), or
- Normalising it across many tables (overkill for a document editor)

MongoDB stores the Lexical state as a **native BSON document** — no serialisation step, no schema mismatch. Motor (async MongoDB driver) works naturally with FastAPI's async handlers.

### Document structure

```json
{
  "_id": "ObjectId",
  "title": "My Post",
  "lexical_state": { ... },     // raw Lexical JSON, stored as native dict
  "plain_text": "",              // derived on every save — used for AI prompts
  "status": "draft",            // "draft" | "published"
  "created_at": "ISO datetime",
  "updated_at": "ISO datetime"
}
```

`lexical_state` is stored as Python `dict` (Pydantic `Optional[dict]`), **not** a stringified JSON blob. This means MongoDB can index and query into it if needed, and there's no parse/stringify overhead on every read/write.

`plain_text` is extracted by the frontend on every editor change and sent alongside `lexical_state`. It gives the AI endpoints clean text without having to traverse the Lexical tree server-side.

---

## Known limitations

- **No authentication** — anyone can read/write any post. Would need JWT + session management.
- **No image upload** — the editor supports text formatting only. Would need S3/Cloudinary integration.
- **No optimistic UI** — saves wait for server confirmation. Could improve perceived speed.
- **Single user** — no collaboration, no conflict resolution.
- **No pagination** — the posts list endpoint returns all posts. Fine for < 100, needs cursor pagination beyond that.

---

## Deployment

### Backend → Render.com

1. Push the repo to GitHub.
2. Go to [dashboard.render.com](https://dashboard.render.com) → **New → Web Service**.
3. Connect your GitHub repo.
4. Set **Root Directory** to `backend`.
5. Set **Build Command** to `pip install -r requirements.txt`.
6. Set **Start Command** to `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
7. Add environment variables:
   - `MONGO_URI` — your Atlas connection string
   - `DATABASE_NAME` — e.g. `smart_blog_editor`
   - `DEEPSEEK_API_KEY` — your API key
   - `CORS_ORIGINS` — your Vercel frontend URL (e.g. `https://blog-editor.vercel.app`)
8. Deploy. Note the URL (e.g. `https://smart-blog-editor-api.onrender.com`).

Alternatively, use the included `render.yaml` Blueprint for automatic configuration.

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New → Project**.
2. Import your GitHub repo.
3. Set **Root Directory** to `frontend`.
4. Framework preset: **Vite**.
5. Add environment variable:
   - `VITE_API_URL` = your Render backend URL (e.g. `https://smart-blog-editor-api.onrender.com`)
6. Deploy.

Or via CLI:

```bash
cd frontend
npx vercel --prod
# When prompted, set VITE_API_URL to your Render URL
```

### Deployed URLs

| Service | URL |
|---------|-----|
| Frontend | https://blog-editor-indol.vercel.app |
| Backend | https://smart-blog-editor-api-f7u7.onrender.com |

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/posts/` | List all posts (lightweight, no lexical_state) |
| `POST` | `/api/posts/` | Create a new draft |
| `GET` | `/api/posts/:id` | Get a single post with full lexical_state |
| `PATCH` | `/api/posts/:id` | Update title, content, or both |
| `POST` | `/api/posts/:id/publish` | Set status to "published" |
| `POST` | `/api/ai/generate` | Stream AI output (summarise or fix grammar) |
