import { useState, useCallback, useRef } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { HeadingNode } from '@lexical/rich-text'
import { ListNode, ListItemNode } from '@lexical/list'
import { $getRoot, $getSelection, $createParagraphNode, $createTextNode } from 'lexical'

import EditorToolbar from './EditorToolbar'
import SaveIndicator from './SaveIndicator'
import AIPanel from './AIPanel'
import AIStreamOutput from '../../ai/components/AIStreamOutput'
import useEditorSync from '../hooks/useEditorSync'
import useAutoSave from '../hooks/useAutoSave'
import useEditorStore from '../../../store/useEditorStore'

const theme = {
    paragraph: 'editor-paragraph',
    heading: {
        h1: 'editor-h1',
        h2: 'editor-h2',
    },
    list: {
        ul: 'editor-ul',
        listitem: 'editor-listitem',
    },
    text: {
        bold: 'editor-bold',
        italic: 'editor-italic',
        code: 'editor-code',
    },
}

function onError(error) {
    console.error('Lexical error:', error)
}

// Inner component that has access to the Lexical editor context.
// We need the editor reference to insert AI output as a paragraph.
function EditorInner() {
    const [editor] = useLexicalComposerContext()
    const handleEditorChange = useEditorSync()

    // get currently selected text from the editor
    const getSelectedText = useCallback(() => {
        let selected = ''
        editor.getEditorState().read(() => {
            const selection = $getSelection()
            if (selection) {
                selected = selection.getTextContent()
            }
        })
        return selected
    }, [editor])

    // insert AI output as a new paragraph at the end
    const handleInsert = useCallback((text) => {
        editor.update(() => {
            const root = $getRoot()
            const paragraph = $createParagraphNode()
            paragraph.append($createTextNode(text))
            root.append(paragraph)
        })
    }, [editor])

    return (
        <>
            <div className="editor-container">
                <SaveIndicator />
                <EditorToolbar />
                <RichTextPlugin
                    contentEditable={
                        <ContentEditable className="editor-input" />
                    }
                    placeholder={
                        <div className="editor-placeholder">Tell your story…</div>
                    }
                    ErrorBoundary={LexicalErrorBoundary}
                />
                <HistoryPlugin />
                <ListPlugin />
                <OnChangePlugin
                    onChange={handleEditorChange}
                    ignoreSelectionChange
                />
            </div>

            <AIPanel getSelectedText={getSelectedText} />
            <AIStreamOutput onInsert={handleInsert} />
        </>
    )
}

function BlogEditor() {
    const title = useEditorStore((s) => s.activePostTitle)
    const updateTitle = useEditorStore((s) => s.updateTitle)

    useAutoSave()

    const initialConfig = {
        namespace: 'BlogEditor',
        theme,
        nodes: [HeadingNode, ListNode, ListItemNode],
        onError,
    }

    return (
        <div className="editor-shell">
            <input
                type="text"
                value={title}
                onChange={(e) => updateTitle(e.target.value)}
                placeholder="Title"
                className="editor-title"
                aria-label="Post title"
            />

            <LexicalComposer initialConfig={initialConfig}>
                <EditorInner />
            </LexicalComposer>
        </div>
    )
}

export default BlogEditor
