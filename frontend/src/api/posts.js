const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function fetchPosts() {
    const res = await fetch(`${API_BASE}/api/posts/`)
    if (!res.ok) throw new Error(`Failed to fetch posts: ${res.status}`)
    return res.json()
}

export async function fetchPost(id) {
    const res = await fetch(`${API_BASE}/api/posts/${id}`)
    if (!res.ok) throw new Error(`Failed to fetch post: ${res.status}`)
    return res.json()
}

export async function createPost(data = {}) {
    const res = await fetch(`${API_BASE}/api/posts/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error(`Failed to create post: ${res.status}`)
    return res.json()
}

export async function updatePost(id, data) {
    const res = await fetch(`${API_BASE}/api/posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error(`Failed to update post: ${res.status}`)
    return res.json()
}

export async function publishPost(id) {
    const res = await fetch(`${API_BASE}/api/posts/${id}/publish`, {
        method: 'POST',
    })
    if (!res.ok) throw new Error(`Failed to publish post: ${res.status}`)
    return res.json()
}
