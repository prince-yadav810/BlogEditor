# PRD — Smart Blog Editor (Neugence Internship Assignment)

## Overview

This is a production-ready Notion/Medium-style block editor built as a full-stack internship assignment. The goal is to demonstrate system architecture thinking, clean component design, and DSA awareness — not just the ability to ship CRUD.

The evaluators are specifically looking for:
- Correct storage of Lexical's JSON editor state (not HTML)
- A clean, purposeful Zustand store
- A handwritten debounce implementation (not lodash)
- An AI integration that streams responses
- UI that looks like a real product

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend Framework | React (Vite) | Standard, fast dev setup |
| Styling | Tailwind CSS | Required by assignment |
| State Management | Zustand | Required by assignment |
| Rich Text Editor | Lexical | Required by assignment |
| Backend | FastAPI (Python) | Async-native, auto-docs, modern |
| Database | MongoDB | Natural fit for Lexical's JSON state |
| AI Provider | DeepSeek | OpenAI-compatible API, paid key available |
| Frontend Deploy | Vercel | Free, instant |
| Backend Deploy | Render | Free tier, supports FastAPI |

---

## UI Style

**Reference: Medium.com editorial style**

- Clean, distraction-free writing surface
- Large editorial typography (serif for headings, clean sans-serif for body)
- Generous white space and line-height
- Minimal chrome — toolbar appears on demand, not always visible
- Color palette: near-white background, near-black text, one subtle accent
- No gradients, no card shadows, no rounded corners everywhere
- Feels like a writing tool, not a dashboard

Typography specifics:
- Heading font: something with editorial weight (e.g. Lora, Playfair Display, or Georgia fallback)
- Body font: clean and readable (e.g. Source Serif Pro or similar)
- Code/monospace blocks: JetBrains Mono or similar
- Base font size: 18–20px for editor content (Medium uses ~21px)
- Line height: 1.7–1.8 for comfortable reading

---

## Folder Structure

Feature-based structure. Each feature owns its components, hooks, and logic.

```
smart-blog-editor/
├── frontend/
│   ├── src/
│   │   ├── features/
│   │   │   ├── editor/
│   │   │   │   ├── components/
│   │   │   │   │   ├── BlogEditor.jsx         # Main Lexical editor wrapper
│   │   │   │   │   ├── EditorToolbar.jsx      # Formatting toolbar
│   │   │   │   │   ├── SaveIndicator.jsx      # "Saving..." / "Saved" badge
│   │   │   │   │   └── AIPanel.jsx            # Generate Summary / Fix Grammar UI
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useAutoSave.js         # Handwritten debounce auto-save
│   │   │   │   │   └── useEditorSync.js       # Syncs Lexical state → Zustand
│   │   │   │   └── plugins/
│   │   │   │       └── AutoSavePlugin.jsx     # Lexical plugin for state capture
│   │   │   ├── posts/
│   │   │   │   ├── components/
│   │   │   │   │   ├── PostList.jsx           # Sidebar list of drafts/published
│   │   │   │   │   └── PostCard.jsx           # Individual post entry
│   │   │   │   └── hooks/
│   │   │   │       └── usePosts.js            # CRUD operations for posts
│   │   │   └── ai/
│   │   │       ├── components/
│   │   │       │   └── AIStreamOutput.jsx     # Streaming text display
│   │   │       └── hooks/
│   │   │           └── useAIStream.js         # Handles DeepSeek streaming
│   │   ├── store/
│   │   │   └── useEditorStore.js              # Central Zustand store
│   │   ├── api/
│   │   │   ├── posts.js                       # Axios calls for post endpoints
│   │   │   └── ai.js                          # Axios calls for AI endpoint
│   │   ├── lib/
│   │   │   └── debounce.js                    # Handwritten debounce utility
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── backend/
│   ├── app/
│   │   ├── main.py                            # FastAPI app entry point
│   │   ├── database.py                        # MongoDB connection (Motor async)
│   │   ├── models/
│   │   │   └── post.py                        # Pydantic models for Post
│   │   ├── routes/
│   │   │   ├── posts.py                       # /api/posts endpoints
│   │   │   └── ai.py                          # /api/ai/generate endpoint
│   │   └── services/
│   │       └── ai_service.py                  # DeepSeek API call logic
│   ├── requirements.txt
│   └── .env
│
├── ARCHITECTURE.md
├── README.md
└── INSTRUCTIONS.md
```

---

## MongoDB Schema

### Post Document

```json
{
  "_id": "ObjectId",
  "title": "string",
  "lexical_state": {},
  "plain_text": "string",
  "status": "draft | published",
  "created_at": "ISODate",
  "updated_at": "ISODate"
}
```

**Key decision — `lexical_state` as a raw JSON object, not serialized string.**

Lexical's `editorState.toJSON()` returns a plain JavaScript object. Storing it as a MongoDB document (not a stringified blob) means:
- No serialization/deserialization overhead
- No risk of double-encoding bugs
- The state can be queried if ever needed
- Reloading is a clean `$setInitialState(lexical_state)` call

`plain_text` is stored alongside as a derived field — used for AI prompts and search without needing to parse the Lexical state.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/posts/ | Create new draft, returns post with generated `_id` |
| GET | /api/posts/ | List all posts (title, status, updated_at) |
| GET | /api/posts/{id} | Get single post with full lexical_state |
| PATCH | /api/posts/{id} | Update content — this is what auto-save hits |
| POST | /api/posts/{id}/publish | Flip status to published |
| POST | /api/ai/generate | Send text to DeepSeek, stream response back |

---

## Auto-Save Logic

This is a graded component. Do not use lodash.debounce.

**Requirement:** Save only after the user stops typing for 2 seconds.

**Implementation plan:**
- Write a standalone `debounce(fn, delay)` utility in `lib/debounce.js`
- The function closes over a `timer` variable using `setTimeout` / `clearTimeout`
- `useAutoSave` hook wraps the PATCH API call in this debounce
- Zustand store holds a `saveStatus` field: `'idle' | 'pending' | 'saving' | 'saved' | 'error'`
- `SaveIndicator` component reads this and shows subtle feedback

**Visual flow:**
```
User types → saveStatus: 'pending' → timer resets
User stops → 2s passes → saveStatus: 'saving' → PATCH fires
Response OK → saveStatus: 'saved' → resets to 'idle' after 3s
Response error → saveStatus: 'error' → shows retry option
```

---

## AI Integration

**Endpoint:** `POST /api/ai/generate`

**Request body:**
```json
{
  "text": "current editor plain text",
  "action": "summarize | fix_grammar"
}
```

**Backend behavior:**
- Calls DeepSeek API using OpenAI-compatible SDK
- Uses `stream=True`
- FastAPI returns a `StreamingResponse`

**Frontend behavior:**
- `useAIStream` hook consumes the stream using `fetch` with `ReadableStream`
- `AIStreamOutput` component renders tokens progressively as they arrive
- User sees text appearing word by word — this is impressive in the demo video

---

## Phases

| Phase | Scope |
|---|---|
| 1 | Project skeleton, Lexical editor, formatting toolbar, Zustand store |
| 2 | FastAPI backend, MongoDB schema, all REST endpoints |
| 3 | Auto-save with handwritten debounce, SaveIndicator |
| 4 | DeepSeek AI integration with streaming |
| 5 | UI polish (Medium style), README, ARCHITECTURE.md, deploy |

Each phase is reviewed before the next begins.

---

## What NOT to Build

- No user authentication (JWT skipped intentionally — keeps focus on graded areas)
- No image upload in editor
- No collaborative editing
- No markdown import/export
- No comments or reactions system
- No search functionality

The assignment rewards depth in the specified areas, not breadth of features.

---

## Evaluation Criteria Mapped to Implementation

| Criterion | How we address it |
|---|---|
| HLD — Lexical JSON storage | MongoDB stores `lexical_state` as native JSON object, reloaded cleanly |
| LLD — Modular React code | Feature-based folder structure, custom hooks per concern |
| LLD — Clean Zustand store | Store has clear slices: editor state, post list, save status, AI state |
| DSA — Debounce | Handwritten in `lib/debounce.js`, commented to show understanding |
| UI Quality | Medium editorial style, Tailwind, frontend-design skill applied |
| Bonus — AI | DeepSeek streaming, two actions (summarize + fix grammar) |
