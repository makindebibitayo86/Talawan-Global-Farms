import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp } from 'lucide-react'

// Shows once the page has scrolled past SHOW_AFTER px, and scrolls smoothly
// back to top on click. Mount this once near the root of the app (e.g. in
// App.jsx / layout, alongside other page-wide chrome) — it's fixed-position,
// so it doesn't matter which section it's rendered inside.
const SHOW_AFTER = 400

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={scrollToTop}
          aria-label="Back to top"
          initial={{ opacity: 0, y: 12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.9 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed bottom-20 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-canvas shadow-lg transition hover:opacity-90 sm:bottom-24 sm:right-6 sm:h-12 sm:w-12"
        >
          <ArrowUp className="h-5 w-5" strokeWidth={2.25} />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
