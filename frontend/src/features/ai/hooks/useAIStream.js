import useEditorStore from '../../../store/useEditorStore'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Streams AI output from the backend, reading chunks as they arrive
// and appending them to Zustand's aiOutput in real-time.
// Uses native fetch + ReadableStream — axios can't do true streaming.

async function streamAI(text, action) {
    const { setAIOutput, setAILoading, setAIAction } = useEditorStore.getState()

    // reset previous output, mark as loading
    setAIOutput('')
    setAILoading(true)
    setAIAction(action)

    try {
        const res = await fetch(`${API_BASE}/api/ai/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, action }),
        })

        if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.detail || `Request failed: ${res.status}`)
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })

            // append chunk to existing output
            const current = useEditorStore.getState().aiOutput
            setAIOutput(current + chunk)
        }
    } catch (err) {
        console.error('AI stream error:', err)
        const current = useEditorStore.getState().aiOutput
        if (!current) {
            setAIOutput(`Error: ${err.message}`)
        }
    } finally {
        setAILoading(false)
        setAIAction(null)
    }
}

export default streamAI
