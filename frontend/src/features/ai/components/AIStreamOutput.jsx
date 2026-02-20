import { useCallback } from 'react'
import useEditorStore from '../../../store/useEditorStore'

// Renders streaming AI output with a blinking cursor,
// plus copy and insert-into-editor actions.

function AIStreamOutput({ onInsert }) {
    const aiOutput = useEditorStore((s) => s.aiOutput)
    const aiLoading = useEditorStore((s) => s.aiLoading)
    const setAIOutput = useEditorStore((s) => s.setAIOutput)

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(aiOutput)
        } catch {
            // fallback for older browsers
            const ta = document.createElement('textarea')
            ta.value = aiOutput
            document.body.appendChild(ta)
            ta.select()
            document.execCommand('copy')
            document.body.removeChild(ta)
        }
    }, [aiOutput])

    const handleInsert = useCallback(() => {
        if (onInsert && aiOutput) {
            onInsert(aiOutput)
            setAIOutput('')
        }
    }, [aiOutput, onInsert, setAIOutput])

    if (!aiOutput && !aiLoading) return null

    return (
        <div className="ai-output">
            <div className="ai-output-header">
                <span className="ai-output-label">AI</span>
                {aiLoading && <span className="ai-output-streaming">streaming</span>}
            </div>

            <div className="ai-output-text">
                {aiOutput}
                {aiLoading && <span className="ai-cursor" />}
            </div>

            {!aiLoading && aiOutput && (
                <div className="ai-output-actions">
                    <button onClick={handleCopy} className="ai-action-btn">
                        Copy
                    </button>
                    <button onClick={handleInsert} className="ai-action-btn ai-action-btn--primary">
                        Insert into editor
                    </button>
                </div>
            )}
        </div>
    )
}

export default AIStreamOutput
