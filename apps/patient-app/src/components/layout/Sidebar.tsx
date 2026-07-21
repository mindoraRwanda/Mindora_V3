'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  Home, Activity, Stethoscope, BookOpen, Users, Phone
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Today', href: '/home', icon: Home },
  { label: 'Check-in', href: '/check-in', icon: Activity },
  { label: 'Therapy', href: '/therapy', icon: Stethoscope },
  { label: 'Reflect', href: '/reflect', icon: BookOpen },
  { label: 'Circle', href: '/circle', icon: Users },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-bg-card border-r border-border flex flex-col z-40">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
            M
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Mindora</p>
            <p className="text-text-muted text-xs">CARE, GENTLY</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-1">
        <p className="text-text-muted text-xs font-medium px-2 py-1 uppercase tracking-wider">
          Your Day
        </p>
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-primary text-white font-medium'
                  : 'text-text-muted hover:text-white hover:bg-bg-elevated'
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Crisis block */}
      <div className="p-3 border-t border-border">
        <div className="bg-bg-elevated rounded-lg p-3 mb-3">
          <p className="text-white text-xs font-medium mb-1">Need someone now?</p>
          <p className="text-text-muted text-xs mb-2">
            24/7 crisis line — always free, always answered.
          </p>
          <a
            href="tel:988"
            className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary-dark text-white text-xs font-medium py-1.5 rounded-md transition-colors"
          >
            <Phone size={12} />
            Call 988
          </a>
        </div>

        {/* User avatar */}
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-bg-elevated transition-colors text-left"
        >
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.userName?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-medium truncate">{user?.userName ?? 'User'}</p>
            <p className="text-text-muted text-xs truncate">{user?.role?.toLowerCase()}</p>
          </div>
        </button>
      </div>
    </aside>
  )
}
