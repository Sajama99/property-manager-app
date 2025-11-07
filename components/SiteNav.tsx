'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

const items = [
    { href: '/', label: 'Home' },
    { href: '/properties', label: 'Properties' },
    { href: '/live', label: 'Live' },
    { href: '/routes', label: 'Routes' },
    { href: '/appointments', label: 'Appointments' },
    { href: '/reports', label: 'Reports' },
    { href: '/admin', label: 'Admin' },
]

export default function SiteNav() {
    const pathname = usePathname()

    return (
        <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
            <nav className="mx-auto max-w-6xl px-4">
                <div className="flex h-12 items-center justify-between">
                    <div className="font-semibold">Property Manager</div>
                    <ul className="flex items-center gap-2 text-sm">
                        {items.map((item) => {
                            const active = item.href === '/'
                                ? pathname === '/'
                                : pathname?.startsWith(item.href)
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={clsx(
                                            'px-2 py-1 rounded hover:bg-gray-100',
                                            active && 'bg-black text-white hover:bg-black'
                                        )}
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            )
                        })}
                        <li className="ml-2 pl-2 border-l text-xs text-white">
                            <span className="rounded bg-gray-900 px-2 py-1">DEV MODE — NO LOGIN</span>
                        </li>
                    </ul>
                </div>
            </nav>
        </header>
    )
}
