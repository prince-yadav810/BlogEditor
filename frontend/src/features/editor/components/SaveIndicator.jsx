import { useEffect, useRef } from 'react'
import useEditorStore from '../../../store/useEditorStore'

// Tiny save status indicator, sits top-right of the editor.
// Follows the 5-state model:
//   idle     → nothing visible
//   pending  → muted dot (user is still typing)
//   saving   → "Saving..." text
//   saved    → "Saved" that fades out after 3s
//   error    → "Save failed" with retry

function SaveIndicator() {
    const saveStatus = useEditorStore((s) => s.saveStatus)
    const setSaveStatus = useEditorStore((s) => s.setSaveStatus)
    const fadeTimer = useRef(null)

    // After "saved" shows, fade back to idle after 3 seconds
    useEffect(() => {
        if (saveStatus === 'saved') {
            fadeTimer.current = setTimeout(() => {
                setSaveStatus('idle')
            }, 3000)
        }

        return () => {
            if (fadeTimer.current) clearTimeout(fadeTimer.current)
        }
    }, [saveStatus, setSaveStatus])

    const handleRetry = () => {
        // Force a re-save by briefly setting pending, which triggers
        // the useAutoSave effect chain again
        setSaveStatus('pending')
    }

    if (saveStatus === 'idle') return null

    return (
        <div className="save-indicator">
            {saveStatus === 'pending' && (
                <span className="save-dot" aria-label="Unsaved changes">•</span>
            )}
            {saveStatus === 'saving' && (
                <span className="save-text">Saving...</span>
            )}
            {saveStatus === 'saved' && (
                <span className="save-text save-text--saved">Saved</span>
            )}
            {saveStatus === 'error' && (
                <span className="save-text save-text--error">
                    Save failed
                    <button onClick={handleRetry} className="save-retry">
                        retry
                    </button>
                </span>
            )}
        </div>
    )
}

export default SaveIndicator
