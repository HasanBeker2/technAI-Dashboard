'use client'

import { Sidebar, Header } from '@/components/layout/sidebar'

interface DashboardLayoutProps {
    children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="min-h-screen bg-[hsl(var(--background))]">
            <Sidebar />
            <Header />
            <main className="ml-64 pt-16">
                <div className="p-6">{children}</div>
            </main>
        </div>
    )
}
