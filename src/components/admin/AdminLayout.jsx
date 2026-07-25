import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
  ShoppingBasket, Mail, Images, Settings, LogOut, Loader2,
  ChevronsLeft, ChevronsRight,
  LayoutTemplate, Info, Tractor, Package, GalleryThumbnails, Phone, Lock,
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import logoIcon from '../../assets/logo-icon-color.png'
import logoWordmark from '../../assets/logo-wordmark-color.png'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

const NAV_ITEMS = [
  { to: '/admin/products', label: 'Products', icon: ShoppingBasket },
  { to: '/admin/messages', label: 'Messages', icon: Mail },
  { to: '/admin/gallery', label: 'Gallery', icon: Images },
]

// Mirrors the tab list in AdminSettings.jsx — kept in sync manually since
// each is a small, independent list of the same site sections.
const SETTINGS_TABS = [
  { key: 'hero', label: 'Hero', icon: LayoutTemplate },
  { key: 'about', label: 'About', icon: Info },
  { key: 'farms', label: 'Farms', icon: Tractor },
  { key: 'products', label: 'Products', icon: Package },
  { key: 'gallery', label: 'Gallery', icon: GalleryThumbnails },
  { key: 'contact', label: 'Contact', icon: Phone },
  { key: 'account', label: 'Password', icon: Lock },
]

const SIDEBAR_STORAGE_KEY = 'talawan-admin-sidebar-collapsed'
const SITE_TITLE = 'Talawan Global Farms'
const IDLE_TIMEOUT_MS = 5 * 60 * 1000 // auto logout after 5 minutes of inactivity
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel']

function BrandMark() {
  return (
    <a
      href="/"
      target="_blank"
      rel="noopener noreferrer"
      title="View site"
      className="flex items-center gap-2 rounded-md transition-opacity hover:opacity-80 md:gap-4"
    >
      <div className="flex items-center gap-2 md:gap-3">
        <img src={logoIcon} alt="" className="h-10 w-auto object-contain md:h-16" />
        <img src={logoWordmark} alt="Talawan Global Farms" className="h-7 w-auto object-contain md:h-10" />
      </div>
      <span className="hidden border-l border-line pl-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-soft sm:inline">
        Admin
      </span>
    </a>
  )
}

function Navbar({ onLogout }) {
  return (
    <header className="flex h-20 shrink-0 items-center justify-between border-b border-line bg-canvas px-4 md:px-6">
      <BrandMark />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onLogout}
          aria-label="Log out"
          title="Log out"
          className="flex items-center gap-1.5 rounded-full bg-red-50 p-2 text-[12px] font-medium uppercase tracking-[0.08em] text-red-600 transition-colors hover:bg-red-100 md:px-4 md:py-2"
        >
          <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
          <span className="hidden md:inline">Log out</span>
        </button>
      </div>
    </header>
  )
}

function Sidebar({ collapsed, onToggle }) {
  const location = useLocation()
  const isSettingsActive = location.pathname.startsWith('/admin/settings')

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col border-r border-line bg-canvas transition-[width] duration-300 ease-out',
        'w-[72px]', // mobile: always icon-only, no expanded view
        collapsed ? 'md:w-[72px]' : 'md:w-56'
      )}
    >
      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Admin sections">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-full px-3 py-2.5 text-[13px] font-medium text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink',
                'justify-center px-0', // mobile: always icon-only, no expanded view
                collapsed ? 'md:justify-center md:px-0' : 'md:justify-start md:px-3',
                isActive && 'bg-primary text-canvas hover:bg-primary hover:text-canvas'
              )
            }
          >
            <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
            {!collapsed && <span className="hidden truncate md:inline">{label}</span>}
          </NavLink>
        ))}

        <div>
          <NavLink
            to="/admin/settings/hero"
            title="Settings"
            className={cn(
              'flex items-center gap-3 rounded-full px-3 py-2.5 text-[13px] font-medium text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink',
              'justify-center px-0', // mobile: always icon-only, no expanded view
              collapsed ? 'md:justify-center md:px-0' : 'md:justify-start md:px-3',
              isSettingsActive && 'bg-primary text-canvas hover:bg-primary hover:text-canvas'
            )}
          >
            <Settings className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
            {!collapsed && <span className="hidden truncate md:inline">Settings</span>}
          </NavLink>

          {/* Stays open the whole time you're anywhere under Settings, with
              the active section highlighted. Icon-only on mobile and on a
              collapsed desktop sidebar, labeled once the sidebar is
              expanded on md+. */}
          {isSettingsActive && (
            <div className="mt-1 flex flex-col gap-1">
              <span className="my-1 h-px w-full bg-line" />
              {SETTINGS_TABS.map(({ key, label, icon: Icon }) => (
                <NavLink
                  key={key}
                  to={`/admin/settings/${key}`}
                  title={label}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-full px-3 py-2 text-[13px] font-medium text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink',
                      'justify-center px-0', // mobile: always icon-only
                      collapsed ? 'md:justify-center md:px-0' : 'md:justify-start',
                      isActive && 'bg-amber-500 text-white hover:bg-amber-500 hover:text-white'
                    )
                  }
                >
                  <Icon className="h-[16px] w-[16px] shrink-0" strokeWidth={2} />
                  {!collapsed && <span className="hidden truncate md:inline">{label}</span>}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="hidden border-t border-line p-3 md:block">
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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
  const location = useLocation()
  const [authState, setAuthState] = useState('checking') // checking | authed
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1'
  })

  // Reflect the current admin section in the browser tab, instead of
  // leaving it on the public site's title.
  useEffect(() => {
    const activeItem = NAV_ITEMS.find((item) => location.pathname.startsWith(item.to))
    document.title = activeItem ? `${activeItem.label} — Admin` : `Admin — ${SITE_TITLE}`
  }, [location.pathname])

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

  // Auto logout after a period of no mouse/keyboard/scroll activity, so an
  // admin session left open on a shared or public machine doesn't stay
  // signed in indefinitely.
  useEffect(() => {
    if (authState !== 'authed') return

    let timeoutId

    function resetTimer() {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(async () => {
        await supabase.auth.signOut()
        navigate('/admin/login', { replace: true })
      }, IDLE_TIMEOUT_MS)
    }

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, resetTimer, { passive: true })
    )
    resetTimer()

    return () => {
      clearTimeout(timeoutId)
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, resetTimer))
    }
  }, [authState, navigate])

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
