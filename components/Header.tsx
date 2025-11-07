'use client'
import Link from 'next/link'

export default function Header() {
    return (
        <header className="flex items-center justify-between p-4 border-b">
            <div className="text-lg font-bold">Property Manager</div>
            <nav className="flex gap-4">
                <Link href="/">Home</Link>
                <Link href="/appointments">Appointments</Link>
                <Link href="/routes">Routes</Link>
            </nav>
        </header>
    )
}
