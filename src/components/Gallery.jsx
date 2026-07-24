import { useRef, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { fetchSectionContent } from '../lib/siteContent'

const CONTENT_SECTION = 'gallery'
const CONTENT_DEFAULTS = {
  'gallery.eyebrow': 'Gallery',
  'gallery.heading': 'A look into our world',
  'gallery.paragraph': 'From sunrise in the fields to the products that make it to your table.',
}

// Same public bucket OurProducts.jsx reads from — every farm and product
// photo lives here as a flat file list (no folders), so the gallery is
// built by listing the bucket and classifying each file rather than by
// a hardcoded array.
const BUCKET = 'farm-images'
const SUPABASE_STORAGE_URL =
  'https://bhcyamtmorvzfckmlhfq.supabase.co/storage/v1/object/public/farm-images/'
const img = (filename) => `${SUPABASE_STORAGE_URL}${filename}`

// How long one full loop (half the duplicated track) takes to autoplay through.
const LOOP_DURATION_MS = 38000

// Momentum tuning for the "flick and let go" feel.
const MOMENTUM_FRICTION_PER_MS = 0.9965 // velocity multiplier applied every 1ms
const MOMENTUM_MIN_VELOCITY = 0.02 // px/ms — below this, momentum ends
const MOMENTUM_MAX_VELOCITY = 3.5 // px/ms — clamp so a fast flick doesn't fling off screen

// "farm-oilpalm-nursery.jpg" -> "Oilpalm Nursery"
// Trailing "-2" / "-3" variants (extra angles of the same shot) collapse
// to the same label as their base file.
function humanize(filename) {
  return filename
    .replace(/\.[^/.]+$/, '')
    .replace(/^farm-/, '')
    .replace(/-\d+$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

const SKELETON_COUNT = 6

function GalleryCardSkeleton() {
  return (
    <div
      className="w-64 shrink-0 animate-pulse overflow-hidden rounded-2xl bg-ink/10 shadow-lg sm:w-72 md:w-80 aspect-[4/5]"
      aria-hidden="true"
    />
  )
}

function Gallery() {
  const [isPaused, setIsPaused] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const [content, setContent] = useState(CONTENT_DEFAULTS)

  useEffect(() => {
    let cancelled = false
    fetchSectionContent(CONTENT_SECTION, CONTENT_DEFAULTS).then((data) => {
      if (!cancelled) setContent(data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const resumeTimer = useRef(null)
  const trackRef = useRef(null)
  const rafRef = useRef(null)
  const lastTimeRef = useRef(null)
  const offsetRef = useRef(0) // current translateX, in px (<= 0)
  const loopWidthRef = useRef(0) // width of one un-duplicated set, in px
  const isDraggingRef = useRef(false)
  const dragStartXRef = useRef(0)
  const dragStartOffsetRef = useRef(0)
  const velocityRef = useRef(0) // px/ms, smoothed during drag
  const lastMoveTimeRef = useRef(0)
  const lastMoveOffsetRef = useRef(0)
  const momentumRef = useRef(false)

  useEffect(() => {
    return () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadGallery() {
      setStatus('loading')

      const [filesRes, productsRes, orderRes] = await Promise.all([
        supabase.storage.from(BUCKET).list('', { limit: 200 }),
        supabase.from('products').select('name, image_filename'),
        supabase.from('gallery_order').select('filename, sort_order, name, category'),
      ])

      if (cancelled) return

      if (filesRes.error || productsRes.error) {
        console.error('Failed to load gallery:', filesRes.error || productsRes.error)
        setStatus('error')
        return
      }

      // Any photo already used as a product's image is a "Product" shot,
      // labelled with that product's name; everything else in the bucket
      // is a "Farm" shot, labelled from its filename.
      const productByFilename = new Map(
        (productsRes.data ?? []).map((p) => [p.image_filename, p.name])
      )

      // Admin-controlled display order, set from the Gallery admin page.
      // Files that predate that table (or a fresh upload not yet ordered)
      // fall back to the end, sorted alphabetically among themselves so
      // the layout stays stable rather than jumping around.
      const orderByFilename = new Map(
        (orderRes.data ?? []).map((o) => [o.filename, o])
      )

      // Resolved display name/category for a card — prefers what the admin
      // set explicitly via the AdminGallery modal (order row's name/category),
      // then falls back to the old inference (product name / humanized
      // filename) so photos uploaded before that feature still show
      // something sensible.
      const built = (filesRes.data ?? [])
        .filter((f) => f.name && f.id) // skip the placeholder ".emptyFolderPlaceholder" entry
        .map((f) => {
          const productName = productByFilename.get(f.name)
          const order = orderByFilename.get(f.name)
          return {
            id: f.id,
            filename: f.name,
            category: order?.category || (productName ? 'Product' : 'Farm'),
            label: order?.name || productName || humanize(f.name),
            img: img(f.name),
          }
        })
        .sort((a, b) => {
          const orderA = orderByFilename.get(a.filename)?.sort_order
          const orderB = orderByFilename.get(b.filename)?.sort_order
          const sortA = orderA != null ? orderA : Infinity
          const sortB = orderB != null ? orderB : Infinity
          if (sortA !== sortB) return sortA - sortB
          return a.filename.localeCompare(b.filename)
        })

      setItems(built)
      setStatus(built.length > 0 ? 'ready' : 'error')
    }

    loadGallery()
    return () => {
      cancelled = true
    }
  }, [])

  // Duplicated once so the strip can loop seamlessly — dragging or
  // autoplay both just move within [-loopWidth, 0) and wrap.
  const trackItems = status === 'ready' ? [...items, ...items] : []

  const applyTransform = useCallback(() => {
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(${offsetRef.current}px)`
    }
  }, [])

  // Measure one set's width whenever the track actually has content.
  useEffect(() => {
    if (status !== 'ready') return

    function measure() {
      if (trackRef.current) {
        loopWidthRef.current = trackRef.current.scrollWidth / 2
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [status, items])

  // Autoplay loop — advances offset unless paused (hover/touch) or dragging.
  useEffect(() => {
    if (status !== 'ready') return

    function frame(time) {
      if (lastTimeRef.current == null) lastTimeRef.current = time
      const dt = time - lastTimeRef.current
      lastTimeRef.current = time

      const loopWidth = loopWidthRef.current
      if (loopWidth > 0 && !isDraggingRef.current) {
        if (momentumRef.current) {
          // Coast on the flick's velocity, decaying with friction, until
          // it's slow enough to hand back off to steady autoplay.
          velocityRef.current *= Math.pow(MOMENTUM_FRICTION_PER_MS, dt)
          let next = offsetRef.current + velocityRef.current * dt
          while (next <= -loopWidth) next += loopWidth
          while (next > 0) next -= loopWidth
          offsetRef.current = next
          applyTransform()

          if (Math.abs(velocityRef.current) < MOMENTUM_MIN_VELOCITY) {
            momentumRef.current = false
            resumeAfter(200)
          }
        } else if (!isPaused) {
          const speed = loopWidth / LOOP_DURATION_MS // px per ms
          let next = offsetRef.current - speed * dt
          while (next <= -loopWidth) next += loopWidth
          offsetRef.current = next
          applyTransform()
        }
      }
      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      lastTimeRef.current = null
    }
  }, [status, isPaused, applyTransform])

  const pauseNow = () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current)
    setIsPaused(true)
  }

  const resumeAfter = (delay) => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current)
    resumeTimer.current = setTimeout(() => setIsPaused(false), delay)
  }

  const handlePointerDown = (e) => {
    if (loopWidthRef.current <= 0) return
    pauseNow()
    momentumRef.current = false
    isDraggingRef.current = true
    setIsDragging(true)
    dragStartXRef.current = e.clientX
    dragStartOffsetRef.current = offsetRef.current
    velocityRef.current = 0
    lastMoveTimeRef.current = performance.now()
    lastMoveOffsetRef.current = offsetRef.current
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return
    const loopWidth = loopWidthRef.current
    if (loopWidth <= 0) return
    const delta = e.clientX - dragStartXRef.current
    let next = dragStartOffsetRef.current + delta
    while (next <= -loopWidth) next += loopWidth
    while (next > 0) next -= loopWidth
    offsetRef.current = next
    applyTransform()

    // Smoothed instantaneous velocity, so the flick at release reflects
    // the last bit of motion rather than the whole drag's average.
    const now = performance.now()
    const dt = now - lastMoveTimeRef.current
    if (dt > 0) {
      let instant = (next - lastMoveOffsetRef.current) / dt
      instant = Math.max(-MOMENTUM_MAX_VELOCITY, Math.min(MOMENTUM_MAX_VELOCITY, instant))
      velocityRef.current = velocityRef.current * 0.7 + instant * 0.3
    }
    lastMoveTimeRef.current = now
    lastMoveOffsetRef.current = next
  }

  const endDrag = (e) => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    setIsDragging(false)
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId)
    } catch {
      // pointer capture may already be released — safe to ignore
    }

    if (Math.abs(velocityRef.current) > MOMENTUM_MIN_VELOCITY) {
      // Let it glide — the rAF loop's momentum phase takes over from here.
      momentumRef.current = true
    } else {
      resumeAfter(600)
    }
  }

  return (
    <section id="gallery" className="overflow-hidden bg-canvas py-20 md:py-28">
      {/* Header — matches Our Products / Our Farms: eyebrow rule, display
          heading, supporting copy, centered to sit as a pair with Our Farms. */}
      <div className="mx-auto mb-12 flex max-w-2xl flex-col items-center gap-4 px-3 text-center md:mb-16 md:px-6">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-accent" aria-hidden="true" />
          <span className="text-[13px] font-medium uppercase tracking-[0.16em] text-primary">
            {content['gallery.eyebrow']}
          </span>
          <span className="h-px w-10 bg-accent" aria-hidden="true" />
        </div>
        <h2 className="font-display text-5xl font-bold leading-[1.1] text-ink sm:text-6xl">
          {content['gallery.heading']}
        </h2>
        <p className="max-w-xl text-base font-medium leading-relaxed text-ink-soft sm:text-lg">
          {content['gallery.paragraph']}
        </p>
      </div>

      {status === 'error' ? (
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-6 text-center">
          <p className="text-[15px] font-medium text-ink-soft">
            We couldn't load the gallery just now.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-[14px] font-semibold text-primary underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      ) : (
        <div
          className={`relative w-full select-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ touchAction: 'pan-y' }}
          onMouseEnter={pauseNow}
          onMouseLeave={(e) => {
            endDrag(e)
            resumeAfter(0)
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {/* Edge fades removed per request — cards now run flush to the container edge. */}

          {status === 'loading' ? (
            <div className="flex w-max gap-6 px-6">
              {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <GalleryCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div ref={trackRef} className="flex w-max gap-6">
              {trackItems.map((item, i) => (
                <div
                  key={`${item.id}-${i}`}
                  className="group relative aspect-[4/5] w-64 shrink-0 overflow-hidden rounded-2xl bg-ink/10 shadow-lg sm:w-72 md:w-80"
                >
                  <img
                    src={item.img}
                    alt={item.label}
                    loading="lazy"
                    draggable="false"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
                  <span className="absolute left-3 top-3 rounded-full bg-canvas/90 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-ink backdrop-blur-sm">
                    {item.category}
                  </span>
                  <p className="absolute bottom-3 left-3 right-3 text-sm font-medium text-white">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default Gallery
