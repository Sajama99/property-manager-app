'use client'
import { useState } from 'react'

export default function Page() {
  const [sharing, setSharing] = useState(false)
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 12, color: '#b91c1c' }}>TEST PAGE LIVE2 🔴</h1>
      <button
        onClick={() => setSharing(!sharing)}
        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #000' }}
      >
        {sharing ? 'Stop Sharing' : 'Share My Location'}
      </button>
      <div style={{ marginTop: 8 }}>
        {sharing ? 'You are sharing your live location.' : 'Your location is private.'}
      </div>
    </div>
  )
}
