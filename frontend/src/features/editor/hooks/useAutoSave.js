import { useEffect, useRef, useCallback } from 'react'
import useEditorStore from '../../../store/useEditorStore'
import { createPost, updatePost } from '../../../api/posts'
import debounce from '../../../lib/debounce'

// How auto-save works:
//
// 1. Every Lexical change → useEditorSync pushes to Zustand (Phase 1)
// 2. This hook watches Zustand's lexicalState / plainText
// 3. On change → immediate "pending" status (user is still typing)
// 4. Debounced save fires after 2s of no changes
// 5. Save starts → "saving", success → "saved", failure → "error"
// 6. "saved" fades back to "idle" after 3s (handled by SaveIndicator)

const DEBOUNCE_DELAY = 2000

function useAutoSave() {
    const lexicalState = useEditorStore((s) => s.lexicalState)
    const plainText = useEditorStore((s) => s.plainText)
    const activePostTitle = useEditorStore((s) => s.activePostTitle)
    const activePostId = useEditorStore((s) => s.activePostId)
    const setSaveStatus = useEditorStore((s) => s.setSaveStatus)
    const setActivePost = useEditorStore((s) => s.setActivePost)

    // Track whether we've seen the initial render — we don't want
    // to auto-save the empty initial state
    const hasContent = useRef(false)
    const isCreating = useRef(false)

    // The actual save function. Not debounced — the debounced wrapper
    // below calls this after the delay.
    const doSave = useCallback(async (postId, state, text, title) => {
        if (!postId || !state) return

        setSaveStatus('saving')

        try {
            await updatePost(postId, {
                title: title,
                lexical_state: state,
                plain_text: text,
            })
            setSaveStatus('saved')
        } catch (err) {
            console.error('Auto-save failed:', err)
            setSaveStatus('error')
        }
    }, [setSaveStatus])

    // Debounced wrapper — stable across re-renders because we create
    // it once in a ref. The debounce closure keeps a single timer
    // that gets reset on each call.
    const debouncedSave = useRef(
        debounce((postId, state, text, title) => {
            doSave(postId, state, text, title)
        }, DEBOUNCE_DELAY)
    ).current

    // Auto-create a draft on first real content if no post exists
    const ensurePostExists = useCallback(async () => {
        if (isCreating.current) return null

        const currentId = useEditorStore.getState().activePostId
        if (currentId) return currentId

        isCreating.current = true
        try {
            const title = useEditorStore.getState().activePostTitle || 'Untitled'
            const newPost = await createPost({ title })
            // Set only the ID — don't overwrite current editor content
            setActivePost({
                _id: newPost._id,
                title: newPost.title,
                lexical_state: useEditorStore.getState().lexicalState,
                plain_text: useEditorStore.getState().plainText,
            })
            return newPost._id
        } catch (err) {
            console.error('Failed to create draft:', err)
            setSaveStatus('error')
            return null
        } finally {
            isCreating.current = false
        }
    }, [setActivePost, setSaveStatus])

    // Watch for content changes
    useEffect(() => {
        // Skip the very first render / empty state
        if (!lexicalState) return
        if (!hasContent.current) {
            hasContent.current = true
            return
        }

        // Content changed — show pending immediately
        setSaveStatus('pending')

        // Make sure we have a post to save to, then queue the save
        const triggerSave = async () => {
            const postId = activePostId || await ensurePostExists()
            if (postId) {
                debouncedSave(postId, lexicalState, plainText, activePostTitle)
            }
        }

        triggerSave()
    }, [lexicalState, plainText]) // intentionally limited deps
}

export default useAutoSave
