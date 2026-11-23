
import React, { useState } from 'react'

// Local fixture: no API calls. Two Egypt cats, one Japan cat.
export const cats = [
    { id: 1, name: 'Egyptian Mau', origin: 'Egypt' },
    { id: 2, name: 'Japanese Bobtail', origin: 'Japan' },
    { id: 3, name: 'Chausie', origin: 'Egypt' },
]

// CONTRIBUTION FOCUS: filter the cat gallery by origin.
export function filterByOrigin(list, origin) {
    const query = origin.trim().toLowerCase()
    if (!query) return list
    return list.filter((cat) => cat.origin.toLowerCase().includes(query))
}

export default function CatGallery() {
    const [origin, setOrigin] = useState('')
    const visible = filterByOrigin(cats, origin)

    return (
        <div>
            <h1>Cat Gallery</h1>
            <input
                aria-label="Filter by origin"
                placeholder="Type an origin, e.g. Egypt"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
            />
            {visible.length === 0 ? (
                <p data-testid="empty-message">No cats found for this origin.</p>
            ) : (
                <ul>
                    {visible.map((cat) => (
                        <li key={cat.id} data-testid="cat-card">
                            {cat.name} ({cat.origin})
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
