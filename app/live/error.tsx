'use client'
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ padding: 24 }}>
      <h2>Live page error</h2>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{error.message}</pre>
      <button onClick={() => reset()} style={{ marginTop: 8, padding: '6px 10px', border: '1px solid #000', borderRadius: 6 }}>
        Try again
      </button>
    </div>
  )
}
