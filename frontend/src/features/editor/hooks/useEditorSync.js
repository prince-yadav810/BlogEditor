import { useCallback } from 'react'
import { $getRoot } from 'lexical'
import useEditorStore from '../../../store/useEditorStore'

// Syncs Lexical editor state → Zustand whenever content changes.
// We pull both the serialized JSON (for persistence) and the plain
// text (used later for AI prompts) on every change. The debounce
// logic that actually fires the save lives elsewhere — this hook
// just keeps the store in sync.

function useEditorSync() {
    const updateContent = useEditorStore((s) => s.updateContent)

    const handleEditorChange = useCallback((editorState) => {
        // Lexical gives us a plain JS object here, not a string.
        // MongoDB stores it natively so no JSON.stringify needed
        const serialized = editorState.toJSON()

        const plainText = editorState.read(() => {
            return $getRoot().getTextContent()
        })

        updateContent(serialized, plainText)
    }, [updateContent])

    return handleEditorChange
}

export default useEditorSync
