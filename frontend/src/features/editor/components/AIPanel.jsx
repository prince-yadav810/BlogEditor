import useEditorStore from '../../../store/useEditorStore'
import streamAI from '../../ai/hooks/useAIStream'

// Two subtle AI action buttons below the editor.
// "Generate Summary" always uses the full plain text.
// "Fix Grammar" uses selected text if available, otherwise full text.

function AIPanel({ getSelectedText }) {
    const plainText = useEditorStore((s) => s.plainText)
    const aiLoading = useEditorStore((s) => s.aiLoading)

    const canRun = !aiLoading && plainText && plainText.trim().length > 0

    const handleSummarize = () => {
        if (!canRun) return
        streamAI(plainText, 'summarize')
    }

    const handleFixGrammar = () => {
        if (!canRun) return
        const selected = getSelectedText?.()
        const text = selected && selected.trim() ? selected : plainText
        streamAI(text, 'fix_grammar')
    }

    return (
        <div className="ai-panel">
            <button
                onClick={handleSummarize}
                disabled={!canRun}
                className="ai-panel-btn"
            >
                ✦ Generate Summary
            </button>
            <button
                onClick={handleFixGrammar}
                disabled={!canRun}
                className="ai-panel-btn"
            >
                ✦ Fix Grammar
            </button>
        </div>
    )
}

export default AIPanel
