import { create } from 'zustand'

// Central store for the editor app.
// Slices are grouped by concern — active post, posts list, save status, AI.
// No async logic lives here; that stays in hooks.

const useEditorStore = create((set) => ({
    // --- Active post ---
    activePostId: null,
    activePostTitle: '',
    lexicalState: null,       // raw JSON from editorState.toJSON()
    plainText: '',            // derived, used for AI prompts + search

    // --- Posts list ---
    posts: [],
    postsLoading: false,

    // --- Save status ---
    saveStatus: 'idle',       // 'idle' | 'pending' | 'saving' | 'saved' | 'error'

    // --- AI state ---
    aiOutput: '',
    aiLoading: false,
    aiAction: null,           // 'summarize' | 'fix_grammar' | null

    // --- Actions ---
    setActivePost: (post) => set({
        activePostId: post?._id || null,
        activePostTitle: post?.title || '',
        lexicalState: post?.lexical_state || null,
        plainText: post?.plain_text || '',
        saveStatus: 'idle',
    }),

    updateTitle: (title) => set({ activePostTitle: title }),

    updateContent: (lexicalState, plainText) => set({
        lexicalState,
        plainText,
    }),

    setSaveStatus: (status) => set({ saveStatus: status }),

    setPosts: (posts) => set({ posts }),
    setPostsLoading: (loading) => set({ postsLoading: loading }),

    setAIOutput: (text) => set({ aiOutput: text }),
    setAILoading: (loading) => set({ aiLoading: loading }),
    setAIAction: (action) => set({ aiAction: action }),

    // convenience — reset editor state when creating a new post
    resetEditor: () => set({
        activePostId: null,
        activePostTitle: '',
        lexicalState: null,
        plainText: '',
        saveStatus: 'idle',
        aiOutput: '',
        aiAction: null,
    }),
}))

export default useEditorStore
