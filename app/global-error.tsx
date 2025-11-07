'use client';

export default function GlobalError({ error }: { error: any }) {
  return (
    <html>
      <body style={{ padding: 20 }}>
        <h1>Global error</h1>
        <pre>{error?.message}</pre>
      </body>
    </html>
  );
}
