import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Egg, Bird, TreePalm, Waves, X, MessageCircle, PlayCircle, ArrowUpRight, Loader2 } from 'lucide-react'
import { buildWhatsAppLink } from '../lib/whatsapp'
import { supabase } from '../lib/supabaseClient'

// Maps the icon_key stored per-farm in site_content to the actual lucide
// component. Keep in sync with the icon choices offered in FarmsSettingsTab.
const ICONS = { egg: Egg, bird: Bird, 'tree-palm': TreePalm, waves: Waves }

function safeParseArray(value) {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// Farm content is admin-editable and lives in the "site_content" table
// (section = 'farms'), same key-value convention as hero/about. A
// "farms.order" row holds the ordered list of farm slugs; each farm's own
// fields are namespaced "farms.<slug>.<field>". This turns that flat
// key-value map into the row shape the rest of this component expects.
function buildFarmsFromRows(rows) {
  const byKey = {}
  for (const row of rows) byKey[row.key] = row.value

  const order = safeParseArray(byKey['farms.order'])

  return order.map((slug) => {
    const get = (field) => byKey[`farms.${slug}.${field}`]
    const IconComponent = ICONS[get('icon_key')] || Egg
    return {
      slug,
      name: get('name') || '',
      icon: IconComponent,
      tagline: get('tagline') || '',
      detail: get('detail') || '',
      process: safeParseArray(get('process')),
      products: safeParseArray(get('products')),
      images: safeParseArray(get('images')),
      // Parallel to `images` — videos[i] is the clip for images[i], or null/
      // missing if that stage doesn't have one yet.
      videos: safeParseArray(get('videos')),
    }
  })
}

const cardReveal = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0 },
}

function FarmModal({ farm, onClose }) {
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

  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    setActiveIndex(0)
  }, [farm])

  if (!farm) return null

  const activeImage = farm.images[activeIndex]
  const activeVideo = farm.videos?.[activeIndex] || null

  const Icon = farm.icon
  const whatsappHref = buildWhatsAppLink(
    `Hi Talawan Global Farms, I'd like to enquire about your ${farm.name} — ${farm.tagline}.`
  )

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center overscroll-none bg-ink/60 p-0 backdrop-blur-sm sm:p-3 md:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="presentation"
    >
      <motion.div
        className="relative flex h-[100dvh] w-full max-w-5xl flex-col overflow-hidden rounded-none bg-canvas shadow-2xl sm:h-auto sm:max-h-[90dvh] sm:rounded-[28px] md:flex-row"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="farm-modal-title"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-canvas/90 text-ink shadow-sm backdrop-blur-sm transition hover:scale-105"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>

        {/* Media panel — desktop only; on mobile the hero image lives inline
            at the top of the scrollable write-up below, so it scrolls away
            with the content instead of staying pinned. */}
        <div className="relative hidden bg-ink/5 md:block md:h-auto md:w-1/2">
          {activeVideo ? (
            <video
              key={activeVideo}
              src={activeVideo}
              autoPlay
              loop
              muted
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <>
              <img
                src={activeImage}
                alt={`${farm.name} at Talawan Global Farms`}
                className="h-full w-full object-cover transition-opacity duration-200"
                key={activeImage}
              />
              <span className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-canvas/90 px-3 py-1.5 text-[12px] font-medium text-ink shadow-sm backdrop-blur-sm">
                <PlayCircle className="h-3.5 w-3.5" strokeWidth={2} />
                Video coming soon
              </span>
            </>
          )}
        </div>

        {/* Detail panel — scrollable content (incl. mobile hero image), CTA pinned below it at all times */}
        <div className="flex min-h-0 w-full flex-1 flex-col md:w-1/2">
          <div className="flex-1 overflow-y-auto overscroll-contain p-5 pb-4 sm:p-6 md:p-10 md:pb-6">
            {/* Mobile hero image — scrolls with the write-up; bleeds edge-to-edge
                via negative margins matching the panel's own padding, clipped
                to the card's rounded corners by the parent's overflow-hidden. */}
            <div className="-mx-5 -mt-5 mb-5 sm:-mx-6 sm:-mt-6 sm:mb-6 md:hidden">
              <div className="relative h-80 w-full bg-ink/5 sm:h-96">
                {activeVideo ? (
                  <video
                    key={activeVideo}
                    src={activeVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <>
                    <img
                      src={activeImage}
                      alt={`${farm.name} at Talawan Global Farms`}
                      className="h-full w-full object-cover transition-opacity duration-200"
                      key={activeImage}
                    />
                    <span className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-canvas/90 px-3 py-1.5 text-[12px] font-medium text-ink shadow-sm backdrop-blur-sm">
                      <PlayCircle className="h-3.5 w-3.5" strokeWidth={2} />
                      Video coming soon
                    </span>
                  </>
                )}
              </div>
            </div>

            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="h-4.5 w-4.5" strokeWidth={2} />
            </span>

            <span className="mt-5 block text-[13px] font-medium uppercase tracking-[0.08em] text-accent-dark">
              {farm.tagline}
            </span>
            <h3
              id="farm-modal-title"
              className="mt-1 font-display text-3xl font-semibold text-ink"
            >
              {farm.name}
            </h3>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
              {farm.detail}
            </p>

            {farm.process?.length > 0 && (
              <div className="mt-6">
                <span className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
                  What we do
                </span>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {farm.process.map((step) => (
                    <li
                      key={step}
                      className="flex items-start gap-2.5 text-[14px] leading-relaxed text-ink"
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {farm.products?.length > 0 && (
              <div className="mt-6">
                <span className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
                  What we produce
                </span>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {farm.products.map((product) => (
                    <li
                      key={product}
                      className="flex items-start gap-2.5 text-[14px] leading-relaxed text-ink"
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                      {product}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {farm.images.length > 1 && (
              <div className="mt-6 grid grid-cols-3 gap-2">
                {farm.images.map((src, idx) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    aria-label={`Show photo ${idx + 1} of ${farm.name}${farm.videos?.[idx] ? ' (video)' : ''}`}
                    aria-pressed={activeIndex === idx}
                    className={`relative aspect-square w-full overflow-hidden rounded-[12px] transition ${
                      activeIndex === idx
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-canvas'
                        : 'opacity-90 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={src}
                      alt={`${farm.name} at Talawan Global Farms`}
                      className="h-full w-full object-cover"
                    />
                    {farm.videos?.[idx] && (
                      <span className="absolute bottom-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-canvas/90 text-primary shadow-sm">
                        <PlayCircle className="h-3 w-3" strokeWidth={2} />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CTA — always visible at the bottom of the info column, never requires scrolling */}
          <div className="shrink-0 border-t border-ink/10 p-5 pt-3 sm:p-6 sm:pt-4 md:p-10 md:pt-4">
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

export default function OurFarms() {
  const [activeFarm, setActiveFarm] = useState(null)
  const [farms, setFarms] = useState([])
  const [header, setHeader] = useState({ label: 'Our Farms', heading: '', intro: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadFarms() {
      const { data, error } = await supabase
        .from('site_content')
        .select('key, value')
        .eq('section', 'farms')

      if (cancelled) return
      if (!error && data) {
        setFarms(buildFarmsFromRows(data))

        const byKey = {}
        for (const row of data) byKey[row.key] = row.value
        setHeader({
          label: byKey['farms.section_label'] || 'Our Farms',
          heading: byKey['farms.heading'] || '',
          intro: byKey['farms.intro'] || '',
        })
      }
      setLoading(false)
    }

    loadFarms()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section id="farms" className="bg-canvas py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-3 md:px-6">
        {/* Header */}
        <div className="mb-14 flex flex-col items-center gap-4 text-center md:mb-16 md:mx-auto md:max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-accent" aria-hidden="true" />
            <span className="text-[13px] font-medium uppercase tracking-[0.16em] text-primary">
              {header.label}
            </span>
            <span className="h-px w-10 bg-accent" aria-hidden="true" />
          </div>
          <h2 className="font-display text-5xl font-bold leading-[1.1] text-ink sm:text-6xl">
            {header.heading.split('\n').map((line, idx, arr) => (
              <span key={idx}>
                {line}
                {idx < arr.length - 1 && <br />}
              </span>
            ))}
          </h2>
          <p className="max-w-xl text-center text-base font-medium leading-relaxed text-ink-soft sm:text-lg">
            {header.intro.split('\n').map((line, idx, arr) => (
              <span key={idx}>
                {line}
                {idx < arr.length - 1 && <br />}
              </span>
            ))}
          </p>
        </div>
      </div>

      {/* Numbered, alternating story list — each division gets a full editorial
          moment: (01) image right / story left, then flips each row down. */}
      <div className="mx-auto max-w-6xl px-3 md:px-6">
        <div className="h-px w-full bg-ink/10" aria-hidden="true" />
        {loading && (
          <div className="flex items-center justify-center gap-2 py-20 text-ink-soft">
            <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.75} />
            <span className="text-[14px] font-medium">Loading farms…</span>
          </div>
        )}
        {!loading && farms.length === 0 && (
          <div className="py-20 text-center text-[14px] font-medium text-ink-soft">
            Farm details coming soon.
          </div>
        )}
        {farms.map((farm, i) => {
          const Icon = farm.icon
          const [hero, ...rest] = farm.images
          const number = String(i + 1).padStart(2, '0')
          const imageOnRight = i % 2 === 0

          return (
            <div key={farm.slug}>
              <motion.button
                type="button"
                onClick={() => setActiveFarm(farm)}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                variants={cardReveal}
                className="group relative grid w-full grid-cols-1 items-center gap-8 py-14 text-left md:grid-cols-2 md:gap-16 md:py-24"
              >
                {/* Giant ghost numeral — the signature element tying the list together */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-10 z-10 select-none font-display text-[115px] font-semibold leading-none text-ink/30 sm:-top-14 sm:text-[140px] md:-top-16 md:text-[170px]"
                  style={imageOnRight ? { right: 0 } : { left: 0 }}
                >
                  {number}
                </span>

                {/* Image */}
                <div className={`relative ${imageOnRight ? 'md:order-2' : 'md:order-1'}`}>
                  <div className="relative overflow-hidden rounded-[28px]">
                    <img
                      src={hero}
                      alt={`${farm.name} at Talawan Global Farms — ${farm.tagline}`}
                      className="aspect-[4/5] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05] sm:aspect-[4/3]"
                    />
                    <span className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-canvas/90 text-primary shadow-sm backdrop-blur-sm">
                      <Icon className="h-4 w-4" strokeWidth={2} />
                    </span>
                  </div>

                  {/* Secondary shots — real photos where we have them, styled
                      placeholders where we don't yet, so every row keeps the
                      same two-thumbnail rhythm. */}
                  {(() => {
                    const placeholderCount = Math.max(0, 2 - rest.length)
                    return (
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        {rest.map((src, j) => (
                          <img
                            key={src}
                            src={src}
                            alt={`${farm.name} at Talawan Global Farms, photo ${j + 2}`}
                            className="aspect-square w-full rounded-[16px] object-cover"
                          />
                        ))}
                        {Array.from({ length: placeholderCount }).map((_, k) => (
                          <div
                            key={`placeholder-${k}`}
                            className="flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-[16px] border border-dashed border-ink/15 bg-ink/[0.025]"
                          >
                            <Icon className="h-4 w-4 text-ink/25" strokeWidth={1.75} />
                            <span className="text-[9px] font-medium uppercase tracking-[0.06em] text-ink/35">
                              More soon
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>

                {/* Story */}
                <div className={`relative z-10 flex flex-col ${imageOnRight ? 'md:order-1' : 'md:order-2'}`}>
                  <span className="flex items-center gap-2 text-[16px] font-semibold uppercase tracking-[0.08em] text-accent-dark">
                    {number} — {farm.tagline}
                  </span>
                  <h3 className="mt-3 font-display text-5xl font-bold text-ink sm:text-6xl">
                    {farm.name}
                  </h3>
                  <p className="mt-5 max-w-lg text-[19px] font-medium leading-relaxed text-ink-soft">
                    {farm.detail}
                  </p>
                  <span className="mt-7 inline-flex w-fit items-center gap-2 text-[16px] font-semibold text-ink transition-transform duration-300 ease-out group-hover:translate-x-1.5">
                    Explore {farm.name}
                    <ArrowUpRight className="h-5 w-5 text-primary" strokeWidth={2} />
                  </span>
                </div>
              </motion.button>

              {i < farms.length - 1 && (
                <div className="h-px w-full bg-ink/10" aria-hidden="true" />
              )}
            </div>
          )
        })}
      </div>

      <AnimatePresence>
        {activeFarm && (
          <FarmModal farm={activeFarm} onClose={() => setActiveFarm(null)} />
        )}
      </AnimatePresence>
    </section>
  )
}
