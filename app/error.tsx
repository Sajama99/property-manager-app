'use client';

export default function Error({ error }: { error: any }) {
  return (
    <div style={{ padding: 20 }}>
      <h1>Error</h1>
      <pre>{error?.message}</pre>
    </div>
  );
}
