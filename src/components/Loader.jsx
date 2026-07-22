import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import logoIcon from '../assets/logo-icon-color.png'
import logoWordmark from '../assets/logo-wordmark-color.png'

// Minimum time the loader stays up, so it never flashes on fast connections
// even if the page finishes loading almost instantly.
const MIN_DISPLAY_MS = 1200

// Keys that would move the page if the loader weren't blocking scroll.
const SCROLL_KEYS = new Set([
  ' ',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'PageUp',
  'PageDown',
  'Home',
  'End',
])

export default function Loader() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow

    // Make sure we start pinned to the very top, then block scroll outright
    // for the duration of the loader — overflow:hidden alone doesn't stop
    // wheel/touch scroll attempts on every browser, so back it up with
    // explicit event blocking.
    window.scrollTo(0, 0)
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'

    const preventScroll = (e) => e.preventDefault()
    const preventScrollKeys = (e) => {
      if (SCROLL_KEYS.has(e.key)) e.preventDefault()
    }

    window.addEventListener('wheel', preventScroll, { passive: false })
    window.addEventListener('touchmove', preventScroll, { passive: false })
    window.addEventListener('keydown', preventScrollKeys)

    let unlocked = false
    const unlock = () => {
      if (unlocked) return
      unlocked = true
      window.removeEventListener('wheel', preventScroll)
      window.removeEventListener('touchmove', preventScroll)
      window.removeEventListener('keydown', preventScrollKeys)
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
    }

    const start = Date.now()
    const finish = () => {
      const elapsed = Date.now() - start
      const remaining = Math.max(MIN_DISPLAY_MS - elapsed, 0)
      setTimeout(() => {
        // Land exactly at the top right before the reveal, so the wipe
        // always opens onto the HeroShell regardless of what happened
        // (or was attempted) underneath while the loader was up.
        window.scrollTo(0, 0)
        unlock()
        setVisible(false)
      }, remaining)
    }

    // If the page (images, fonts, etc.) is already done loading by the time
    // this mounts, finish on the min timer. Otherwise wait for `load`.
    if (document.readyState === 'complete') {
      finish()
    } else {
      window.addEventListener('load', finish)
    }

    return () => {
      window.removeEventListener('load', finish)
      unlock()
    }
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <div key="loader" className="fixed inset-0 z-[9999] overflow-hidden">
          {/* Two solid panels forming the full-screen cover. On exit they
              slide apart like double doors, revealing the page beneath. */}
          <motion.div
            className="absolute inset-y-0 left-0 w-1/2 bg-canvas"
            exit={{ x: '-100%' }}
            transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1], delay: 0.3 }}
          />
          <motion.div
            className="absolute inset-y-0 right-0 w-1/2 bg-canvas"
            exit={{ x: '100%' }}
            transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1], delay: 0.3 }}
          />

          {/* Logo sits above the panels and fades/scales out first, so it
              never gets visually split down the middle by the wipe. */}
          <motion.div
            className="absolute inset-0 z-10 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div className="flex items-center gap-4">
              <img
                src={logoIcon}
                alt=""
                className="h-24 w-24 object-contain sm:h-32 sm:w-32"
              />
              <img
                src={logoWordmark}
                alt="Talawan Global Farms"
                className="h-14 w-auto object-contain sm:h-[4.5rem]"
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
