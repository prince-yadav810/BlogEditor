# Auto-save — debounce + state machine

## Overview

Auto-save has two files:
- `lib/debounce.js` — generic debounce utility (closure-based)
- `hooks/useAutoSave.js` — the save logic that uses debounce

## Debounce via closure

```js
export default function debounce(fn, delay) {
    let timer                      // ← closed over
    return (...args) => {
        clearTimeout(timer)
        timer = setTimeout(() => fn(...args), delay)
    }
}
```

The returned function and `fn` share a single `timer` variable through closure. Every invocation clears the previous timer and starts a new one. Only the **last** call within the `delay` window fires.

This is why we don't use a bare `setTimeout` — without the closure, each call would create an independent timer, and we'd get N saves instead of 1.

### Why 2 seconds

- **Too short (< 1s):** Most users are mid-sentence, triggering unnecessary saves
- **Too long (> 5s):** Risk losing content on tab close or crash
- **2 seconds:** User has stopped typing, safe to save. Matches Medium's auto-save cadence.

## State machine

```mermaid
stateDiagram-v2
    [*] --> idle

    idle --> pending : lexicalState changed
    pending --> pending : more changes (timer resets)
    pending --> saving : debounce delay elapsed

    saving --> saved : 200 OK from server
    saving --> error : network error / 4xx / 5xx

    saved --> idle : 3 second fade timeout

    error --> saving : user clicks Retry
    error --> pending : user types again
```

### Why `pending` is set synchronously

```js
// Inside useAutoSave:
useEffect(() => {
    if (lexicalState !== prevRef.current) {
        setSaveStatus('pending')   // ← immediate, no debounce
        debouncedSave()            // ← fires after 2s
        prevRef.current = lexicalState
    }
}, [lexicalState])
```

The `pending` state is set the instant content changes — before the debounce timer starts. This guarantees the UI always shows "unsaved changes" while the user is typing. If we set `pending` inside the debounced function, there'd be a 2-second window where the user has unsaved changes but the UI shows nothing.

### Auto-create draft

If there's no `activePostId` in the store, the save function calls `POST /api/posts/` to create a new draft, stores the returned ID, then immediately PATCHes content to it. This means users never need to explicitly create a post — they just start typing.

## Sequence diagram

```mermaid
sequenceDiagram
    participant U as User
    participant E as Lexical Editor
    participant Z as Zustand Store
    participant D as Debounce
    participant S as Server

    U->>E: types "Hello"
    E->>Z: updateContent(json, plainText)
    Z->>Z: saveStatus = 'pending'
    Z->>D: debouncedSave()
    Note over D: timer starts (2s)

    U->>E: types " world"
    E->>Z: updateContent(json, plainText)
    Z->>D: debouncedSave()
    Note over D: timer reset (2s again)

    Note over D: 2s pass, no more typing
    D->>Z: saveStatus = 'saving'
    D->>S: PATCH /api/posts/:id
    S-->>D: 200 OK
    D->>Z: saveStatus = 'saved'
    Note over Z: 3s later → 'idle'
```
