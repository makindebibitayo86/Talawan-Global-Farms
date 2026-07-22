import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
  Package, Mail, Images, Settings, LogOut, Loader2, ExternalLink,
  ChevronsLeft, ChevronsRight,
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import logoIcon from '../../assets/logo-icon-color.png'
import logoWordmark from '../../assets/logo-wordmark-color.png'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

const NAV_ITEMS = [
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/messages', label: 'Messages', icon: Mail },
  { to: '/admin/gallery', label: 'Gallery', icon: Images },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

const SIDEBAR_STORAGE_KEY = 'talawan-admin-sidebar-collapsed'

function BrandMark() {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3">
        <img src={logoIcon} alt="" className="h-12 w-auto object-contain" />
        <img src={logoWordmark} alt="Talawan Global Farms" className="h-8 w-auto object-contain" />
      </div>
      <span className="hidden border-l border-line pl-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-soft sm:inline">
        Admin
      </span>
    </div>
  )
}

function Navbar({ onLogout }) {
  return (
    <header className="flex h-20 shrink-0 items-center justify-between border-b border-line bg-canvas px-4 md:px-6">
      <BrandMark />

      <div className="flex items-center gap-2">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-medium uppercase tracking-[0.08em] text-ink-soft transition-colors hover:text-primary"
        >
          View site
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
        </a>
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-1.5 rounded-full bg-ink/5 px-4 py-2 text-[12px] font-medium uppercase tracking-[0.08em] text-ink transition-colors hover:bg-ink/10"
        >
          <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
          Log out
        </button>
      </div>
    </header>
  )
}

function Sidebar({ collapsed, onToggle }) {
  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col border-r border-line bg-canvas transition-[width] duration-300 ease-out',
        collapsed ? 'w-[72px]' : 'w-56'
      )}
    >
      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Admin sections">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-full px-3 py-2.5 text-[13px] font-medium text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink',
                collapsed && 'justify-center px-0',
                isActive && 'bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary'
              )
            }
          >
            <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-line p-3">
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'flex w-full items-center gap-3 rounded-full px-3 py-2.5 text-[13px] font-medium text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink',
            collapsed && 'justify-center px-0'
          )}
        >
          {collapsed ? (
            <ChevronsRight className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
          ) : (
            <>
              <ChevronsLeft className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}

function AdminFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="shrink-0 border-t border-line bg-canvas px-4 py-4 md:px-6">
      <p className="text-center text-[12px] text-ink-soft/70">
        © {year} Talawan Global Farms — Admin Panel
      </p>
    </footer>
  )
}

export default function AdminLayout() {
  const navigate = useNavigate()
  const [authState, setAuthState] = useState('checking') // checking | authed
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1'
  })

  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      if (!data.session) {
        navigate('/admin/login', { replace: true })
      } else {
        setAuthState('authed')
      }
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate('/admin/login', { replace: true })
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [navigate])

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? '1' : '0')
      return next
    })
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/admin/login', { replace: true })
  }

  if (authState === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas-alt">
        <Loader2 className="h-6 w-6 animate-spin text-ink-soft" strokeWidth={2} />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas-alt">
      <Navbar onLogout={handleLogout} />

      <div className="flex flex-1">
        <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} />
        <main className="flex-1 overflow-x-hidden px-4 py-8 md:px-8 md:py-10">
          <Outlet />
        </main>
      </div>

      <AdminFooter />
    </div>
  )
}
