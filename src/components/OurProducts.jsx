import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, MessageCircle, ArrowUpRight, Egg, Bird, TreePalm, Waves, Volume2, VolumeX } from 'lucide-react'
import { buildWhatsAppLink } from '../lib/whatsapp'
import { supabase } from '../lib/supabaseClient'
import { fetchSectionContent } from '../lib/siteContent'

const SECTION = 'products'

const CONTENT_DEFAULTS = {
  'products.eyebrow': 'Our Products',
  'products.heading': 'What comes off the farm.',
  'products.paragraph':
    'Day-old chicks, table eggs, market-ready birds, palm seedlings, fruit bunches, and pond-raised waterfowl — available for bulk and retail purchase. Tap a product to see more and enquire.',
}

// Product photos live in Supabase Storage (public "farm-images" bucket)
// rather than the codebase — img() resolves a filename to its public URL.
const SUPABASE_STORAGE_URL =
  'https://bhcyamtmorvzfckmlhfq.supabase.co/storage/v1/object/public/farm-images/'
const img = (filename) => `${SUPABASE_STORAGE_URL}${filename}`

// Products themselves now live in the `products` table so the admin can add,
// edit, or reorder them without a code change — this just maps each row's
// `icon_key` to the actual icon component.
const ICONS = {
  egg: Egg,
  bird: Bird,
  'tree-palm': TreePalm,
  waves: Waves,
}

const cardReveal = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
}

const SKELETON_COUNT = 6

function ProductCardSkeleton() {
  return (
    <div
      className="flex animate-pulse flex-col overflow-hidden rounded-[28px] bg-canvas shadow-sm"
      aria-hidden="true"
    >
      <div className="aspect-[4/3] w-full bg-ink/10" />
      <div className="flex flex-col p-6 sm:p-7">
        <div className="space-y-2.5">
          <div className="h-5 w-3/4 rounded-full bg-ink/10" />
          <div className="h-3.5 w-1/2 rounded-full bg-ink/10" />
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-3 w-full rounded-full bg-ink/10" />
          <div className="h-3 w-full rounded-full bg-ink/10" />
          <div className="h-3 w-2/3 rounded-full bg-ink/10" />
        </div>
        <div className="mt-6 h-11 w-11 rounded-full bg-ink/10" />
      </div>
    </div>
  )
}

function ProductCard({ product, index, onOpen }) {
  const Icon = ICONS[product.icon_key] ?? Egg

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(product)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: (index % 6) * 0.07 }}
      variants={cardReveal}
      className="group flex flex-col overflow-hidden rounded-[28px] bg-canvas text-left shadow-sm transition-shadow duration-300 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden">
        <img
          src={img(product.image_filename)}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
        />
        <span className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-canvas/90 text-primary shadow-sm backdrop-blur-sm">
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <h3 className="font-display text-xl font-bold uppercase leading-tight text-ink sm:text-2xl">
          {product.name}
        </h3>
        <span className="mt-0.5 block text-[13px] font-semibold uppercase tracking-[0.06em] text-accent-dark sm:text-sm">
          {product.tagline}
        </span>

        <p className="mt-4 mb-6 line-clamp-3 text-[14px] leading-relaxed text-ink-soft">
          {product.description}
        </p>

        <span
          aria-hidden="true"
          className="mt-auto flex h-11 w-11 items-center justify-center self-start rounded-full bg-accent text-ink shadow-sm transition-transform duration-300 ease-out group-hover:translate-x-1"
        >
          <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
        </span>
      </div>
    </motion.button>
  )
}

function ProductModal({ product, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)

    // iOS Safari still allows background touch-scroll with plain
    // `overflow: hidden` on the body, so pin it in place instead.
    const scrollY = window.scrollY
    const body = document.body
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    }
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
    body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      body.style.position = prev.position
      body.style.top = prev.top
      body.style.left = prev.left
      body.style.right = prev.right
      body.style.width = prev.width
      body.style.overflow = prev.overflow
      window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' })
    }
  }, [onClose])

  const [isMuted, setIsMuted] = useState(true)

  useEffect(() => {
    setIsMuted(true)
  }, [product])

  if (!product) return null

  const Icon = ICONS[product.icon_key] ?? Egg
  const whatsappHref = buildWhatsAppLink(
    `Hi Talawan Global Farms, I'd like to enquire about ${product.name} — ${product.tagline}.`
  )

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-3 backdrop-blur-sm md:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="presentation"
    >
      <motion.div
        className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] bg-canvas shadow-2xl md:flex-row"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-canvas/90 text-ink shadow-sm backdrop-blur-sm transition hover:scale-105"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>

        {/* Photo panel */}
        <div className="relative h-64 w-full shrink-0 bg-ink/5 md:h-auto md:w-1/2">
          {product.video_path ? (
            <>
              <video
                key={product.video_path}
                src={product.video_path}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => setIsMuted((m) => !m)}
                aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-canvas/90 text-ink shadow-sm backdrop-blur-sm transition hover:scale-105"
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" strokeWidth={2} />
                ) : (
                  <Volume2 className="h-4 w-4" strokeWidth={2} />
                )}
              </button>
            </>
          ) : (
            <img
              src={img(product.image_filename)}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          )}
          <span className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-canvas/90 px-3 py-1.5 text-[12px] font-medium text-ink shadow-sm backdrop-blur-sm">
            <Icon className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
            {product.category}
          </span>
        </div>

        {/* Detail panel — scrollable content, CTA pinned below it at all times */}
        <div className="flex min-h-0 w-full flex-1 flex-col md:w-1/2">
          <div className="flex-1 overflow-y-auto p-6 pb-4 md:p-10 md:pb-6">
            <span className="block text-[13px] font-medium uppercase tracking-[0.08em] text-accent-dark">
              {product.tagline}
            </span>
            <h3
              id="product-modal-title"
              className="mt-1 font-display text-3xl font-semibold text-ink"
            >
              {product.name}
            </h3>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-soft md:text-[17px] md:font-medium">
              {product.description}
            </p>

            {product.details?.length > 0 && (
              <div className="mt-6">
                <span className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
                  Product details
                </span>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {product.details.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-[14px] leading-relaxed text-ink"
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.specs?.length > 0 && (
              <div className="mt-6">
                <span className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
                  At a glance
                </span>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-4 rounded-[16px] bg-ink/[0.03] p-4">
                  {product.specs.map((spec) => (
                    <div key={spec.label}>
                      <dt className="text-[11px] font-medium uppercase tracking-[0.06em] text-ink-soft">
                        {spec.label}
                      </dt>
                      <dd className="mt-1 text-[13.5px] font-medium leading-snug text-ink">
                        {spec.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>

          {/* CTA — always visible at the bottom of the info column, never requires scrolling */}
          <div className="shrink-0 border-t border-ink/10 p-6 pt-4 md:p-10 md:pt-4">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-[14px] font-medium text-canvas transition hover:opacity-90"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={2} />
              Enquire on WhatsApp
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function OurProducts() {
  const [activeProduct, setActiveProduct] = useState(null)
  const [products, setProducts] = useState([])
  const [content, setContent] = useState(CONTENT_DEFAULTS)
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'

  useEffect(() => {
    let cancelled = false
    fetchSectionContent(SECTION, CONTENT_DEFAULTS).then((data) => {
      if (!cancelled) setContent(data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadProducts() {
      setStatus('loading')
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('sort_order', { ascending: true })

      if (cancelled) return

      if (error) {
        console.error('Failed to load products:', error)
        setStatus('error')
        return
      }

      setProducts(data ?? [])
      setStatus('ready')
    }

    loadProducts()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section id="products" className="bg-canvas-alt py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-3 md:px-6">
        {/* Header — mirrors Our Farms but left-aligned, so the two sections
            read as a pair without feeling identical. */}
        <div className="mb-12 flex flex-col gap-4 md:mb-16 md:max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-accent" aria-hidden="true" />
            <span className="text-[13px] font-medium uppercase tracking-[0.16em] text-primary">
              {content['products.eyebrow']}
            </span>
          </div>
          <h2 className="font-display text-5xl font-bold leading-[1.1] text-ink sm:whitespace-nowrap sm:text-6xl">
            {content['products.heading']}
          </h2>
          <p className="max-w-xl text-base font-medium leading-relaxed text-ink-soft sm:text-lg">
            {content['products.paragraph']}
          </p>
        </div>

        {status === 'error' ? (
          <div className="flex flex-col items-center gap-3 rounded-[28px] bg-canvas p-10 text-center">
            <p className="text-[15px] font-medium text-ink-soft">
              We couldn't load the product catalogue just now.
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
          <div className="grid grid-cols-1 gap-x-0.5 gap-y-1 sm:grid-cols-2 lg:grid-cols-4">
            {status === 'loading'
              ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))
              : products.map((product, i) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={i}
                    onOpen={setActiveProduct}
                  />
                ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {activeProduct && (
          <ProductModal product={activeProduct} onClose={() => setActiveProduct(null)} />
        )}
      </AnimatePresence>
    </section>
  )
}
