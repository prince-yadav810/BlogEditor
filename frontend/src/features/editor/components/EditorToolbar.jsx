import { useCallback, useEffect, useRef, useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
    $getSelection,
    $isRangeSelection,
    $createParagraphNode,
    FORMAT_TEXT_COMMAND,
    SELECTION_CHANGE_COMMAND,
    COMMAND_PRIORITY_LOW,
} from 'lexical'
import { $setBlocksType } from '@lexical/selection'
import { HeadingNode, $createHeadingNode } from '@lexical/rich-text'
import {
    INSERT_UNORDERED_LIST_COMMAND,
    REMOVE_LIST_COMMAND,
    ListNode,
    ListItemNode,
    $isListNode,
} from '@lexical/list'
import { $getNearestNodeOfType } from '@lexical/utils'

// Floating toolbar — appears above the text selection, Medium-style.
// Positioning logic: we grab the native selection rect and place the
// toolbar centered above it with a small offset.

function EditorToolbar() {
    const [editor] = useLexicalComposerContext()
    const toolbarRef = useRef(null)
    const [visible, setVisible] = useState(false)
    const [position, setPosition] = useState({ top: 0, left: 0 })
    const [activeFormats, setActiveFormats] = useState({
        bold: false,
        italic: false,
        heading: null, // 'h1' | 'h2' | null
        list: false,
    })

    const updateToolbar = useCallback(() => {
        editor.getEditorState().read(() => {
            const selection = $getSelection()
            if (!$isRangeSelection(selection) || selection.isCollapsed()) {
                setVisible(false)
                return
            }

            // figure out what's active
            const isBold = selection.hasFormat('bold')
            const isItalic = selection.hasFormat('italic')

            // check heading type on anchor node
            const anchorNode = selection.anchor.getNode()
            const parent = anchorNode.getParent()
            let headingTag = null
            if (parent && parent.getType && parent.getType() === 'heading') {
                headingTag = parent.getTag()
            }

            // check if we're inside a list
            let isList = false
            const topLevelElement = anchorNode.getTopLevelElementOrThrow()
            if ($isListNode(topLevelElement)) {
                isList = true
            } else {
                // might be a ListItemNode whose parent is a ListNode
                const parentList = $getNearestNodeOfType(anchorNode, ListNode)
                if (parentList) isList = true
            }

            setActiveFormats({
                bold: isBold,
                italic: isItalic,
                heading: headingTag,
                list: isList,
            })

            // position the toolbar above the selection
            const nativeSelection = window.getSelection()
            if (!nativeSelection || nativeSelection.rangeCount === 0) {
                setVisible(false)
                return
            }

            const range = nativeSelection.getRangeAt(0)
            const rect = range.getBoundingClientRect()

            if (rect.width === 0 && rect.height === 0) {
                setVisible(false)
                return
            }

            const toolbarEl = toolbarRef.current
            const toolbarWidth = toolbarEl ? toolbarEl.offsetWidth : 220
            const toolbarHeight = toolbarEl ? toolbarEl.offsetHeight : 40

            // we need position relative to .editor-container since the
            // toolbar is position:absolute inside it
            const container = toolbarEl?.parentElement
            const containerRect = container
                ? container.getBoundingClientRect()
                : { top: 0, left: 0 }

            setPosition({
                top: rect.top - containerRect.top - toolbarHeight - 8,
                left: rect.left - containerRect.left + rect.width / 2 - toolbarWidth / 2,
            })
            setVisible(true)
        })
    }, [editor])

    useEffect(() => {
        return editor.registerCommand(
            SELECTION_CHANGE_COMMAND,
            () => {
                updateToolbar()
                return false
            },
            COMMAND_PRIORITY_LOW
        )
    }, [editor, updateToolbar])

    // also update on mouseup anywhere — handles drag-select
    useEffect(() => {
        const onMouseUp = () => {
            // small delay so the selection finalizes
            setTimeout(updateToolbar, 10)
        }
        document.addEventListener('mouseup', onMouseUp)
        return () => document.removeEventListener('mouseup', onMouseUp)
    }, [updateToolbar])

    const formatBold = () => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')
        setTimeout(updateToolbar, 10)
    }

    const formatItalic = () => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')
        setTimeout(updateToolbar, 10)
    }

    const formatHeading = (tag) => {
        editor.update(() => {
            const selection = $getSelection()
            if (!$isRangeSelection(selection)) return

            if (activeFormats.heading === tag) {
                // toggle off — back to paragraph
                $setBlocksType(selection, () => $createParagraphNode())
            } else {
                $setBlocksType(selection, () => $createHeadingNode(tag))
            }
        })
        setTimeout(updateToolbar, 10)
    }

    const toggleList = () => {
        if (activeFormats.list) {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
        } else {
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
        }
        setTimeout(updateToolbar, 10)
    }


    return (
        <div
            ref={toolbarRef}
            className="editor-toolbar"
            style={{
                position: 'absolute',
                top: `${position.top}px`,
                left: `${position.left}px`,
                zIndex: 50,
                opacity: visible ? 1 : 0,
                pointerEvents: visible ? 'auto' : 'none',
                transition: 'opacity 0.12s ease-out',
            }}
            // prevent toolbar clicks from killing the selection
            onMouseDown={(e) => e.preventDefault()}
        >
            <button
                onClick={formatBold}
                className={`toolbar-btn ${activeFormats.bold ? 'active' : ''}`}
                title="Bold"
                aria-label="Bold"
            >
                <strong>B</strong>
            </button>
            <button
                onClick={formatItalic}
                className={`toolbar-btn ${activeFormats.italic ? 'active' : ''}`}
                title="Italic"
                aria-label="Italic"
            >
                <em>I</em>
            </button>

            <span className="toolbar-divider" />

            <button
                onClick={() => formatHeading('h1')}
                className={`toolbar-btn ${activeFormats.heading === 'h1' ? 'active' : ''}`}
                title="Heading 1"
                aria-label="Heading 1"
            >
                H1
            </button>
            <button
                onClick={() => formatHeading('h2')}
                className={`toolbar-btn ${activeFormats.heading === 'h2' ? 'active' : ''}`}
                title="Heading 2"
                aria-label="Heading 2"
            >
                H2
            </button>

            <span className="toolbar-divider" />

            <button
                onClick={toggleList}
                className={`toolbar-btn ${activeFormats.list ? 'active' : ''}`}
                title="Bulleted list"
                aria-label="Bulleted list"
            >
                {/* simple list icon */}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <circle cx="2" cy="4" r="1.5" />
                    <circle cx="2" cy="8" r="1.5" />
                    <circle cx="2" cy="12" r="1.5" />
                    <rect x="5.5" y="3" width="9" height="2" rx="0.5" />
                    <rect x="5.5" y="7" width="9" height="2" rx="0.5" />
                    <rect x="5.5" y="11" width="9" height="2" rx="0.5" />
                </svg>
            </button>
        </div>
    )
}

export default EditorToolbar
