import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ArrowRight, Mouse, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import logoIcon from '../assets/logo-icon-color.png'
import logoWordmark from '../assets/logo-wordmark-color.png'
import { fetchSectionContent } from '../lib/siteContent'

const NAV_LINKS = [
  { label: 'About Us', href: '#about' },
  {
    label: 'Meet Us',
    dropdown: [
      { label: 'Our Farms', href: '#farms' },
      { label: 'Products', href: '#products' },
    ],
  },
  {
    label: 'Community',
    dropdown: [
      { label: 'Gallery', href: '#gallery' },
      { label: 'Team', href: '#team' },
    ],
  },
]

// Section key for this component's row group in `site_content`.
const SECTION = 'hero'

// Fallback content — used until Supabase responds, and for any key
// the admin hasn't set yet. Keeps the current hardcoded copy/assets
// as the default so the site never regresses if a row is missing.
const HERO_DEFAULTS = {
  'hero.heading': 'The Next Generation of Farming is Here',
  'hero.cta_label': 'Get in Touch',
  'hero.video_url': '/videos/hero-farm.mp4',
  'hero.poster_url': '/videos/hero-poster.jpg',
  'hero.logo_icon_url': logoIcon,
  'hero.logo_wordmark_url': logoWordmark,
}

/**
 * Notch geometry — measured directly from the reference frame (1536x1024 mockup),
 * not approximated. The frame's bottom edge is flat, then two mirrored cubic
 * Bézier curves (horizontal tangent at both the flat edges and the valley
 * center) carry the card's own material DOWN into a shallow rounded bump —
 * it is not a cutout of a different color, it's a continuous extension of
 * the same shape.
 *
 * Measured (in reference px, frame width 1536):
 *   flat bottom edge y        = 909
 *   valley floor y             = 1007   (depth = 98)
 *   notch total width          = 394    (x 571 -> 965, centered on x 768)
 *   left curve control points  = (82.08, 0) and (86.41, 98) relative to a
 *                                 0,0 -> 394,98 local box
 * Fit residual (bezier vs. sampled pixels): < 2px across the whole profile.
 *
 * This gives an exact width:height ratio of 394:98 (≈ 4.02:1). Any box you
 * render this path into must keep that ratio or the curve will distort.
 */
const NOTCH_VIEWBOX_W = 394
const NOTCH_VIEWBOX_H = 98

// Rendered notch dimensions, matching the h-*/w-* classes the bump used to
// carry (394:98 ratio preserved at both breakpoints).
const NOTCH_MOBILE = { width: 240, height: 59.7 }
const NOTCH_DESKTOP = { width: 300, height: 74.62 }

// Corner radius measured directly from the reference (52px at 1536px frame width).
const CORNER_RADIUS_DESKTOP = 'md:rounded-[52px]'
const CORNER_RADIUS_MOBILE = 'rounded-[32px]'
const RADIUS_MOBILE = 32
const RADIUS_DESKTOP = 52

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Builds a single clip-path outline for the video layer: a rounded rect
 * (all four corners) for the card body, with the notch curve carved into
 * the middle of the bottom edge and continuing the card's material down
 * into the bump. `width`/`height` are the card's own rect dimensions in
 * px; the clipped element must be `height + notch.height` tall so the
 * bump has somewhere to extend into.
 */
function buildHeroClipPath(width, height, notch, radius) {
  if (!width || !height) return undefined

  const sx = notch.width / NOTCH_VIEWBOX_W
  const sy = notch.height / NOTCH_VIEWBOX_H
  const left = width / 2 - notch.width / 2
  const x = (lx) => (left + lx * sx).toFixed(2)
  const y = (ly) => (height + ly * sy).toFixed(2)
  const r = radius

  const d = [
    `M ${r},0`,
    `L ${width - r},0`,
    `A ${r},${r} 0 0 1 ${width},${r}`,
    `L ${width},${height - r}`,
    `A ${r},${r} 0 0 1 ${width - r},${height}`,
    `L ${x(394)},${y(0)}`,
    `C ${x(311.9204)},${y(0)} ${x(307.5937)},${y(98)} ${x(197)},${y(98)}`,
    `C ${x(86.4063)},${y(98)} ${x(82.0796)},${y(0)} ${x(0)},${y(0)}`,
    `L ${r},${height}`,
    `A ${r},${r} 0 0 1 0,${height - r}`,
    `L 0,${r}`,
    `A ${r},${r} 0 0 1 ${r},0`,
    'Z',
  ].join(' ')

  return `path('${d}')`
}

export default function HeroShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileSubOpen, setMobileSubOpen] = useState(false)
  const wrapperRef = useRef(null)
  const heroRef = useRef(null)
  const [heroSize, setHeroSize] = useState({ width: 0, height: 0 })
  const [isDesktop, setIsDesktop] = useState(false)
  const [content, setContent] = useState(HERO_DEFAULTS)

  // Pull editable copy/assets from Supabase. Falls back to
  // HERO_DEFAULTS on error or for any key not yet set by the admin.
  useEffect(() => {
    let cancelled = false
    fetchSectionContent(SECTION, HERO_DEFAULTS).then((data) => {
      if (!cancelled) setContent(data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Measure the card's own rect (excluding the notch) so the clip path
  // can be rebuilt in real pixels whenever the layout changes.
  useEffect(() => {
    const el = heroRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setHeroSize({ width, height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Track the md breakpoint so we pick the matching notch/radius sizing.
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)')
    const onChange = () => setIsDesktop(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  const notch = isDesktop ? NOTCH_DESKTOP : NOTCH_MOBILE
  const radius = isDesktop ? RADIUS_DESKTOP : RADIUS_MOBILE
  const heroClipPath = buildHeroClipPath(heroSize.width, heroSize.height, notch, radius)

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    if (!mobileOpen) setMobileSubOpen(false)
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const handleScrollDown = () => {
    const next = wrapperRef.current?.nextElementSibling
    if (next) {
      next.scrollIntoView({ behavior: 'smooth' })
    } else {
      window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })
    }
  }

  return (
    <div ref={wrapperRef} className="relative bg-canvas px-3 pt-3 md:px-6 md:pt-6">
      <section
        id="home"
        ref={heroRef}
        className={cn(
          'relative h-[52vh] min-h-[420px] w-full overflow-visible md:h-[90vh] md:min-h-[600px]',
          CORNER_RADIUS_MOBILE,
          CORNER_RADIUS_DESKTOP
        )}
      >
        {/* Video background layer — clipped to the card's rounded rect PLUS
            the notch bump in one continuous shape, so the same video plays
            uninterrupted behind the rotating scroll indicator. Taller than
            the card itself by the notch depth so there's room for the dip. */}
        <div
          className={cn(
            'absolute inset-x-0 top-0 overflow-hidden bg-ink',
            !heroClipPath && CORNER_RADIUS_MOBILE,
            !heroClipPath && CORNER_RADIUS_DESKTOP
          )}
          style={{
            height: heroSize.height ? heroSize.height + notch.height : '100%',
            clipPath: heroClipPath,
          }}
        >
          <video
            autoPlay
            muted
            loop
            playsInline
            poster={content['hero.poster_url']}
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src={content['hero.video_url']} type="video/mp4" />
          </video>
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/35 to-ink/75" />
        </div>

        {/* Navbar — integrated inside the hero, glassmorphism over video */}
        <header
          className={cn(
            'absolute inset-x-0 top-0 z-30 bg-transparent',
            CORNER_RADIUS_MOBILE,
            CORNER_RADIUS_DESKTOP
          )}
        >
          <div className="mx-auto flex h-16 max-w-full items-center justify-between px-4 md:h-24 lg:px-6">
            {/* Logo */}
            <a
              href="#home"
              className="flex shrink-0 items-center gap-3 drop-shadow-md"
              aria-label="Talawan Global Farms home"
            >
              <img src={content['hero.logo_icon_url']} alt="" className="h-9 w-auto object-contain md:h-20" />
              <img
                src={content['hero.logo_wordmark_url']}
                alt="Talawan Global Farms"
                className="h-6 w-auto object-contain md:h-11"
              />
            </a>

            {/* Nav + CTA group — kept together so the links sit close to the button */}
            <div className="hidden items-center lg:flex">
              <nav className="flex items-center" aria-label="Primary">
                {NAV_LINKS.map((link, i) =>
                  link.dropdown ? (
                    <div
                      key={link.label}
                      className={cn(
                        'group relative px-5 py-2',
                        i !== 0 && 'border-l border-white/20'
                      )}
                    >
                      <button
                        type="button"
                        className="flex items-center gap-1 text-[13px] font-medium uppercase tracking-[0.08em] text-white/90 transition-colors"
                      >
                        <span className="inline-block transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:text-accent">
                          {link.label}
                        </span>
                        <ChevronDown className="h-3 w-3 transition-transform duration-300 ease-out group-hover:rotate-180 group-hover:text-accent" strokeWidth={2} />
                      </button>
                      <span
                        aria-hidden="true"
                        className="absolute left-1/2 -bottom-0.5 h-[1.5px] w-[calc(100%-2.5rem)] origin-center -translate-x-1/2 scale-x-0 bg-accent transition-transform duration-300 ease-out group-hover:scale-x-100"
                      />

                      {/* Dropdown panel — bridged by the pt-3 spacer so the hover chain
                          survives the gap between trigger and panel. */}
                      <div className="invisible absolute left-1/2 top-full z-40 w-48 -translate-x-1/2 pt-3 opacity-0 transition-all duration-200 ease-out group-hover:visible group-hover:opacity-100">
                        <div className="overflow-hidden rounded-2xl bg-canvas shadow-xl ring-1 ring-black/5">
                          {link.dropdown.map((sub) => (
                            <a
                              key={sub.href}
                              href={sub.href}
                              className="block px-5 py-3 text-[13px] font-medium uppercase tracking-[0.06em] text-ink transition-colors hover:bg-line-soft hover:text-primary"
                            >
                              {sub.label}
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <a
                      key={link.href}
                      href={link.href}
                      className={cn(
                        'group relative px-5 py-2 text-[13px] font-medium uppercase tracking-[0.08em] text-white/90 transition-colors',
                        i !== 0 && 'border-l border-white/20'
                      )}
                    >
                      <span className="inline-block transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:text-accent">
                        {link.label}
                      </span>
                      <span
                        aria-hidden="true"
                        className="absolute left-1/2 -bottom-0.5 h-[1.5px] w-[calc(100%-2.5rem)] origin-center -translate-x-1/2 scale-x-0 bg-accent transition-transform duration-300 ease-out group-hover:scale-x-100"
                      />
                    </a>
                  )
                )}
              </nav>

              {/* Right cluster */}
              <div className="ml-8 flex items-center gap-6">
                <a
                  href="#get-in-touch"
                  className="group inline-flex items-center gap-3 rounded-full bg-canvas py-1.5 pl-5 pr-1.5 text-[13px] font-medium uppercase tracking-[0.08em] text-ink transition-colors hover:bg-white"
                >
                  {content['hero.cta_label']}
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-canvas transition-colors group-hover:bg-primary">
                    <ArrowRight className="h-4 w-4" strokeWidth={2} />
                  </span>
                </a>
              </div>
            </div>

            {/* Mobile toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="inline-flex items-center justify-center rounded-sm p-2 text-white transition-colors hover:text-accent lg:hidden"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              {mobileOpen ? (
                <X className="h-6 w-6" strokeWidth={1.75} />
              ) : (
                <Menu className="h-6 w-6" strokeWidth={1.75} />
              )}
            </button>
          </div>

          {/* Mobile menu */}
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                id="mobile-menu"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden border-t border-line bg-canvas lg:hidden"
              >
                <nav className="flex flex-col px-6 py-4" aria-label="Mobile primary">
                  {NAV_LINKS.map((link) =>
                    link.dropdown ? (
                      <div key={link.label} className="border-b border-line-soft last:border-b-0">
                        <button
                          type="button"
                          onClick={() => setMobileSubOpen((v) => !v)}
                          aria-expanded={mobileSubOpen}
                          className="flex w-full items-center justify-between py-3 text-[15px] font-medium uppercase tracking-[0.06em] text-ink-soft transition-colors hover:text-primary"
                        >
                          {link.label}
                          <ChevronDown
                            className={cn('h-4 w-4 transition-transform duration-300', mobileSubOpen && 'rotate-180')}
                            strokeWidth={1.75}
                          />
                        </button>
                        <AnimatePresence>
                          {mobileSubOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.25, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              {link.dropdown.map((sub) => (
                                <a
                                  key={sub.href}
                                  href={sub.href}
                                  onClick={() => setMobileOpen(false)}
                                  className="block py-3 pl-4 text-[14px] font-medium uppercase tracking-[0.06em] text-ink-soft/80 transition-colors hover:text-primary"
                                >
                                  {sub.label}
                                </a>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <a
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className="border-b border-line-soft py-3 text-[15px] font-medium uppercase tracking-[0.06em] text-ink-soft transition-colors last:border-b-0 hover:text-primary"
                      >
                        {link.label}
                      </a>
                    )
                  )}
                  <a
                    href="#get-in-touch"
                    onClick={() => setMobileOpen(false)}
                    className="mt-3 inline-flex items-center justify-center rounded-sm bg-primary px-5 py-3 text-[13px] font-medium uppercase tracking-[0.08em] text-canvas transition-colors hover:bg-primary-dark"
                  >
                    {content['hero.cta_label']}
                  </a>
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Hero copy */}
        <div className="relative z-10 flex h-full items-center px-6 lg:px-10">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center text-center">
            <h1 className="max-w-4xl font-hero text-3xl leading-[1.12] text-white sm:text-4xl md:text-6xl lg:text-7xl">
              {content['hero.heading']}
            </h1>
          </div>
        </div>

        {/* Circular scroll indicator — hollow ring (tire, no rim) sitting in the valley cut.
            Center is transparent so the video layer underneath shows through the hole. */}
        <button
          type="button"
          onClick={handleScrollDown}
          aria-label="Scroll to next section"
          className="group absolute -bottom-10 left-1/2 z-30 h-20 w-20 -translate-x-1/2 md:-bottom-16 md:h-32 md:w-32"
        >
          {/* Ring band only — border creates the "tire", center stays transparent so
              the video shows through. Border width tuned so the rotating text sits
              right on the inner edge of the band. */}
          <span className="absolute inset-0 rounded-full border-[13px] border-ink shadow-lg transition-colors group-hover:border-ink/90 md:border-[22px]" />

          {/* Rotating text ring */}
          <motion.svg
            viewBox="0 0 100 100"
            className="absolute inset-0 h-full w-full text-white"
            animate={{ rotate: 360 }}
            transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
          >
            <defs>
              <path
                id="scroll-ring-path"
                d="M 50,50 m -38.8,0 a 38.8,38.8 0 1,1 77.6,0 a 38.8,38.8 0 1,1 -77.6,0"
              />
            </defs>
            <text fill="currentColor" fontSize="7.5" letterSpacing="1.5">
              <textPath href="#scroll-ring-path" startOffset="0%">
                CLICK TO EXPLORE &#8226;
              </textPath>
            </text>
            <text fill="currentColor" fontSize="7.5" letterSpacing="1.5">
              <textPath href="#scroll-ring-path" startOffset="50%">
                CLICK TO EXPLORE &#8226;
              </textPath>
            </text>
          </motion.svg>

          {/* Static centered mouse icon — stays put while the text ring rotates around it */}
          <span className="absolute inset-0 flex items-center justify-center">
            <Mouse className="h-8 w-8 text-white transition-colors group-hover:text-accent" strokeWidth={1.75} />
          </span>
        </button>
      </section>
    </div>
  )
}
