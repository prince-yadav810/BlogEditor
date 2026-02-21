import { Link } from 'react-router-dom'
import MermaidDiagram from '../../components/MermaidDiagram'
import './DocsPage.css'

const EDITOR_STATE_DIAGRAM = `flowchart LR
    A[User types in Lexical] --> B[editorState.toJSON]
    B --> C{Storage choice}
    C -->|HTML string| D[Lossy — metadata lost]
    C -->|JSON dict| E[Lossless — full fidelity]
    E --> F[MongoDB native BSON]
    F --> G[editor.parseEditorState on reload]
    G --> H[Exact state restored]`

const AUTOSAVE_DIAGRAM = `stateDiagram-v2
    [*] --> idle
    idle --> pending : Content changed
    pending --> saving : 2s debounce fires
    saving --> saved : Server 200 OK
    saving --> error : Network error
    saved --> idle : Fade after 3s
    error --> saving : User clicks Retry
    error --> pending : Content changed again`

const STREAMING_DIAGRAM = `sequenceDiagram
    participant U as User
    participant R as React (useAIStream)
    participant F as FastAPI
    participant D as DeepSeek API

    U->>R: Click "Generate Summary"
    R->>F: POST /api/ai/generate
    F->>D: stream=True request
    D-->>F: token chunks
    F-->>R: StreamingResponse chunks
    R-->>U: Progressive token render`

export default function DocsPage() {
    return (
        <div className="docs-page">
            {/* Top nav */}
            <nav className="docs-nav">
                <Link to="/" className="docs-nav-back">← Back to Editor</Link>
                <span className="docs-nav-title">Smart Blog Editor — Docs</span>
                <span className="docs-nav-spacer" />
            </nav>

            <article className="docs-article">
                {/* Hero */}
                <header className="docs-hero">
                    <h1 className="docs-hero-title">How It's Built</h1>
                    <p className="docs-hero-subtitle">
                        A technical walkthrough of the Smart Blog Editor — architecture
                        decisions, core concepts, and the reasoning behind them.
                    </p>
                </header>

                {/* Section 1 */}
                <section className="docs-section">
                    <h2>Tech Stack & Why</h2>
                    <p>
                        The frontend is built with React 19 and Lexical, Meta's
                        extensible text editor framework. Lexical was chosen over
                        Draft.js, Slate, or Quill because it represents editor state
                        as a serialisable JSON tree rather than relying on the DOM as
                        its source of truth. This means the entire document can be
                        saved, restored, and diffed without ever touching
                        innerHTML — a property that becomes critical when you need
                        lossless persistence (more on this in Section 3).
                    </p>
                    <p>
                        State management uses Zustand instead of Redux or React
                        Context. Zustand provides a single store with no boilerplate —
                        no providers, no reducers, no action creators. The store is
                        split into four logical slices (active post, posts list, save
                        status, AI state) that can be subscribed to independently,
                        avoiding unnecessary re-renders.
                    </p>
                    <p>
                        The backend runs on FastAPI with Motor, the async MongoDB
                        driver. FastAPI was a natural fit because it supports streaming
                        responses natively — essential for piping DeepSeek's
                        token-by-token output directly to the browser. MongoDB stores
                        Lexical's JSON state as a native BSON document, which means no
                        serialisation overhead and no schema mismatch.
                    </p>
                    <p>
                        AI features use DeepSeek's API via the OpenAI Python SDK.
                        DeepSeek was chosen for cost-effectiveness and its compatibility
                        with the OpenAI client library, letting us stream completions
                        with minimal integration code.
                    </p>
                </section>

                {/* Section 2 */}
                <section className="docs-section">
                    <h2>Architecture & Folder Structure</h2>
                    <p>
                        The project uses a feature-based folder structure rather than
                        the traditional layer-based approach (separating all components
                        into one folder, all hooks into another, and so on). The
                        reasoning is straightforward: when you work on the editor, you
                        want the editor's components, hooks, and styles co-located —
                        not scattered across the tree.
                    </p>
                    <p>
                        A layer-based structure works fine for small projects, but as
                        features grow, navigating between related files becomes
                        increasingly expensive. Feature-based grouping keeps cognitive
                        load low: everything related to a capability lives in one
                        directory.
                    </p>
                    <pre className="docs-code-block">{`frontend/src/
├── api/               # HTTP clients (posts.js, ai.js)
├── components/        # Shared components (Footer, MermaidDiagram)
├── features/
│   ├── editor/
│   │   ├── components/  # BlogEditor, EditorToolbar, SaveIndicator, AIPanel
│   │   └── hooks/       # useAutoSave, useEditorSync
│   └── ai/
│       ├── components/  # AIStreamOutput
│       └── hooks/       # useAIStream
├── lib/               # Utilities (debounce.js)
├── store/             # Zustand store (useEditorStore.js)
└── pages/             # Route-level pages (DocsPage)

backend/app/
├── models/            # Pydantic schemas (PostCreate, PostUpdate, PostResponse)
├── routes/            # API endpoints (posts.py, ai.py)
├── services/          # Business logic (ai_service.py)
├── database.py        # Motor client + collection refs
└── main.py            # FastAPI app, CORS, route registration`}</pre>
                </section>

                {/* Section 3 */}
                <section className="docs-section">
                    <h2>Storing Editor State: JSON vs HTML</h2>
                    <p>
                        This is arguably the most important technical decision in the
                        project. When a user types in the editor, Lexical maintains an
                        internal state tree — a deeply nested JSON object that
                        describes every paragraph, every formatting mark, every
                        selection. The question is: what do you store in the database?
                    </p>
                    <p>
                        One approach is to serialise the state to HTML and store the
                        HTML string. This is simpler and produces human-readable
                        output. But it's lossy. HTML doesn't encode Lexical's internal
                        metadata — selection positions, node keys, custom properties.
                        When you load the HTML back and parse it into a Lexical state,
                        you get an approximation, not a restoration. Cursor position
                        is gone. Custom node data is gone. Undo history can't be
                        reconstructed.
                    </p>
                    <p>
                        The alternative — and what this project does — is to store the
                        raw JSON tree from <code>editorState.toJSON()</code> as a
                        native MongoDB document. This is lossless. When the user
                        returns, we call <code>editor.parseEditorState(json)</code> and
                        the editor is restored to the exact state it was in, right
                        down to the node structure. No data loss, no approximation.
                    </p>
                    <p>
                        Storing JSON also plays to MongoDB's strengths. The Lexical
                        state tree maps naturally to BSON's document model — nested
                        objects, arrays, key-value pairs. There's no impedance
                        mismatch, no stringify/parse overhead, and MongoDB can index
                        into the structure if needed.
                    </p>
                    <MermaidDiagram chart={EDITOR_STATE_DIAGRAM} />
                </section>

                {/* Section 4 */}
                <section className="docs-section">
                    <h2>Auto-Save: The Debounce Pattern</h2>
                    <p>
                        Saving on every keystroke would be wasteful — a fast typist
                        generates 5–10 onChange events per second. Instead, the editor
                        uses a closure-based debounce function that collapses rapid
                        calls into a single invocation.
                    </p>
                    <p>
                        The debounce function works by sharing a single timer variable
                        via JavaScript closure. Each call clears the previous timer
                        and sets a new one. If the user types 10 characters in quick
                        succession, the first 9 timers get cancelled, and only the
                        10th call actually fires the save — 2 seconds after the last
                        keystroke. This is a pure closure pattern: the timer variable
                        lives in the function's lexical scope, not in component state,
                        which means it persists between calls without triggering
                        re-renders.
                    </p>
                    <p>
                        The save process follows a strict five-state machine:
                        idle → pending → saving → saved → idle (or saving → error).
                        When content changes, the status immediately moves to
                        "pending" — this is synchronous, before the debounce timer
                        fires. This ensures the user always sees visual feedback that
                        their changes will be saved. The "pending" state shows a small
                        grey dot; "saving" shows "Saving..."; "saved" shows "Saved ✓"
                        and fades after 3 seconds. If the network request fails, the
                        status moves to "error" with a retry button.
                    </p>
                    <MermaidDiagram chart={AUTOSAVE_DIAGRAM} />
                </section>

                {/* Section 5 */}
                <section className="docs-section">
                    <h2>AI Streaming: End to End</h2>
                    <p>
                        When the user clicks "Generate Summary," the request travels
                        through four layers. The React component calls the
                        <code>streamAI</code> function, which sends a POST request
                        to <code>/api/ai/generate</code> using the Fetch API. The
                        FastAPI backend receives the request, validates the input,
                        and forwards it to DeepSeek's chat completions endpoint with
                        <code>stream=True</code>.
                    </p>
                    <p>
                        DeepSeek returns tokens one by one. FastAPI wraps this in a
                        <code>StreamingResponse</code> with
                        content type <code>text/event-stream</code>, piping each
                        chunk directly to the HTTP response without buffering. On the
                        frontend, the <code>streamAI</code> function reads the
                        response body using a <code>ReadableStream</code> reader,
                        decoding each chunk with <code>TextDecoder</code> and
                        appending it to Zustand's <code>aiOutput</code> state.
                    </p>
                    <p>
                        This architecture was chosen over axios for a specific reason:
                        axios buffers the entire response before resolving the
                        promise. It doesn't support true streaming. The Fetch API's
                        <code>ReadableStream</code> interface gives us access to each
                        chunk as it arrives, enabling the progressive token-by-token
                        rendering that makes AI output feel responsive rather than
                        delayed.
                    </p>
                    <MermaidDiagram chart={STREAMING_DIAGRAM} />
                </section>

                <footer className="docs-footer-note">
                    Built by Prince Yadav for Neugence · 2026
                </footer>
            </article>
        </div>
    )
}
