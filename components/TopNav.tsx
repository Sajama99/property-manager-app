'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
    { href: '/', label: 'Home' },
    { href: '/properties', label: 'Properties' },
    { href: '/appointments', label: 'Appointments' },
    { href: '/routes', label: 'Routes' },
    { href: '/live', label: 'Live' },
    { href: '/reports', label: 'Reports' },
]

export default function TopNav() {
    const pathname = usePathname()

    return (
        <div className="w-full border-b bg-white">
            <div className="mx-auto max-w-6xl px-4">
                <div className="h-12 flex items-center gap-4">
                    <div className="font-semibold">Property Manager</div>
                    <nav className="flex items-center gap-2 text-sm">
                        {links.map((l) => {
                            const active =
                                pathname === l.href ||
                                (l.href !== '/' && pathname?.startsWith(l.href))
                            return (
                                <Link
                                    key={l.href}
                                    href={l.href}
                                    className={`px-2 py-1 rounded ${active ? 'bg-black text-white' : 'hover:bg-gray-100'
                                        }`}
                                >
                                    {l.label}
                                </Link>
                            )
                        })}
                    </nav>
                </div>
            </div>
        </div>
    )
}
