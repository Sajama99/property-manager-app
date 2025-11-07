// app/layout.tsx
import './globals.css';
import Navbar from './components/Navbar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Property Manager App',
  description: 'Property / units / work orders / inspections',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        style={{
          margin: 0,
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          background: '#f8fafc',
        }}
      >
        {/* top nav */}
        <Navbar />
        {/* page content */}
        <main style={{ paddingTop: 60 }}>{children}</main>
      </body>
    </html>
  );
}
