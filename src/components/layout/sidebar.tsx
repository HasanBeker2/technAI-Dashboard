'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    FolderKanban,
    Clock,
    FileText,
    Receipt,
    Settings,
    HelpCircle,
    Search,
    Bell,
    User,
    ChevronDown,
    Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Clients', href: '/clients', icon: Building2 },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Invoices', href: '/invoices', icon: FileText },
    { name: 'Timesheets', href: '/timesheets', icon: Clock },
    { name: 'Expenses', href: '/expenses', icon: Receipt },
]

const secondaryNavigation = [
    { name: 'Help & Support', href: '/help', icon: HelpCircle },
    { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            {/* Logo */}
            <div className="flex h-16 items-center gap-3 border-b border-[hsl(var(--border))] px-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--chart-4))]">
                    <span className="text-lg font-bold text-[hsl(var(--background))]">T</span>
                </div>
                <span className="text-lg font-semibold">TechnAI</span>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                isActive
                                    ? 'bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.2)]'
                                    : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]'
                            )}
                        >
                            <item.icon className={cn('h-5 w-5', isActive && 'text-[hsl(var(--primary))]')} />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            {/* Secondary Navigation */}
            <div className="border-t border-[hsl(var(--border))] px-3 py-4">
                {secondaryNavigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                isActive
                                    ? 'bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]'
                                    : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]'
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    )
                })}
            </div>
        </aside>
    )
}

export function Header() {
    return (
        <header className="fixed left-64 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/0.8)] px-6 backdrop-blur-lg">
            {/* Search */}
            <div className="relative w-96">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                <input
                    type="text"
                    placeholder="Search projects, invoices, etc."
                    className="h-10 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] pl-10 pr-4 text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)]"
                />
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
                {/* Notifications */}
                <button className="relative rounded-lg p-2 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]">
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[hsl(var(--primary))]" />
                </button>

                {/* User menu */}
                <button className="flex items-center gap-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-3 py-2 transition-colors hover:border-[hsl(var(--primary)/0.3)]">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--chart-4))]">
                        <User className="h-4 w-4 text-[hsl(var(--background))]" />
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-medium">Admin User</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                </button>
            </div>
        </header>
    )
}
