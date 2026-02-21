import { useEffect, useRef, useId } from 'react'
import mermaid from 'mermaid'

mermaid.initialize({
    startOnLoad: false,
    theme: 'neutral',
    fontFamily: 'DM Sans, system-ui, sans-serif',
    fontSize: 14,
})

export default function MermaidDiagram({ chart }) {
    const ref = useRef(null)
    const id = `mermaid-${useId().replace(/:/g, '')}`

    useEffect(() => {
        if (!ref.current) return

        // Clear previous render
        ref.current.innerHTML = ''

        mermaid.render(id, chart).then(({ svg }) => {
            if (ref.current) {
                ref.current.innerHTML = svg
            }
        }).catch((err) => {
            console.error('Mermaid render error:', err)
            if (ref.current) {
                ref.current.innerHTML = `<pre style="color:#c0392b;font-size:12px">${err.message}</pre>`
            }
        })
    }, [chart, id])

    return (
        <div className="mermaid-container">
            <div ref={ref} />
        </div>
    )
}
