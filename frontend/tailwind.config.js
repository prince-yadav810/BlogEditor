/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                heading: ['Lora', 'Georgia', 'serif'],
                body: ['Source Serif 4', 'Georgia', 'serif'],
                ui: ['DM Sans', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
            },
            colors: {
                bg: '#faf9f7',
                surface: '#ffffff',
                'text-primary': '#1a1a1a',
                'text-secondary': '#757575',
                'text-muted': '#b0b0b0',
                accent: '#1a8917',
                border: '#e8e8e8',
                danger: '#c0392b',
            },
        },
    },
    plugins: [],
}
