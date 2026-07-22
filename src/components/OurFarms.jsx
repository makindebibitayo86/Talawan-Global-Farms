import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Egg, Bird, TreePalm, Waves, X, MessageCircle, PlayCircle, ArrowUpRight } from 'lucide-react'
import { buildWhatsAppLink } from '../lib/whatsapp'

// Farm photos live in Supabase Storage (public "farm-images" bucket) rather
// than the codebase — img() just resolves a filename to its public URL.
const SUPABASE_STORAGE_URL =
  'https://bhcyamtmorvzfckmlhfq.supabase.co/storage/v1/object/public/farm-images/'
const img = (filename) => `${SUPABASE_STORAGE_URL}${filename}`

const FARMS = [
  {
    name: 'Poultry',
    icon: Egg,
    tagline: 'Day-old chicks, broilers & layers',
    detail:
      "Our poultry division runs the full lifecycle in-house. It starts in a climate-controlled brooder house, where thousands of day-old chicks are raised under close watch. As they mature, birds are split into two paths: layer flocks that go on to egg production, and broilers finished for the table.",
    process: [
      'Day-old chick brooding in a climate-controlled house',
      'Feed, water & health monitoring through grow-out',
      'Layer flock management for egg production',
      'Broiler finishing to market weight',
    ],
    products: ['Day-old chicks', 'Fresh eggs', 'Broiler chickens (table birds)'],
    images: [
      img('farm-poultry-brooder.jpg'),
      img('farm-poultry-dayold.jpg'),
      img('farm-poultry-layers.jpg'),
    ],
    video: null, // e.g. '/videos/farm-poultry.mp4'
  },
  {
    name: 'Turkey',
    icon: Bird,
    tagline: 'Open-house turkey rearing',
    detail:
      'Turkeys are raised the slow way, under open housing with room to roam and grow to full market size — no shortcuts, just steady feeding and flock care until they’re ready.',
    process: ['Free-range rearing under open housing', 'Daily feed & flock health monitoring'],
    products: ['Market-ready turkeys', 'Live turkey sales'],
    images: [
      img('farm-turkey.jpg'),
      img('farm-turkey-2.jpg'),
      img('farm-turkey-3.jpg'),
    ],
    video: null,
  },
  {
    name: 'Oil Palm Plantation',
    icon: TreePalm,
    tagline: 'Nursery to fruit bunch',
    detail:
      'Every palm on the plantation starts as a seedling in our greenhouse nursery. Once established, seedlings are field-planted and cultivated into full groves, which mature to produce the fruit bunches we harvest and trade.',
    process: [
      'Greenhouse seedling nursery',
      'Field planting & cultivation of palm groves',
      'Fruit bunch harvesting',
    ],
    products: ['Palm seedlings', 'Oil palm fruit bunches', 'Palm produce trade'],
    images: [
      img('farm-oilpalm-nursery.jpg'),
      img('farm-oilpalm-tree.jpg'),
      img('farm-oilpalm-fruit.jpg'),
    ],
    video: null,
  },
  {
    name: 'Duck Farming',
    icon: Waves,
    tagline: 'Pond-raised waterfowl',
    detail:
      'A fenced pond shaded by mature trees gives our ducks and geese an open-water home where they can roam and swim freely — closer to a natural habitat than a standard pen.',
    process: [
      'Pond & fenced enclosure management',
      'Daily flock care across a shaded, natural habitat',
    ],
    products: ['Live ducks & geese'],
    images: [
      img('farm-ducks.jpg'),
      img('farm-ducks-2.jpg'),
      img('farm-ducks-3.jpg'),
    ],
    video: null,
  },
]

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

  const [activeImage, setActiveImage] = useState(farm?.images[0])

  useEffect(() => {
    setActiveImage(farm?.images[0])
  }, [farm])

  if (!farm) return null

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
          {farm.video ? (
            <video
              src={farm.video}
              poster={farm.images[0]}
              controls
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
                {farm.video ? (
                  <video
                    src={farm.video}
                    poster={farm.images[0]}
                    controls
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
                    onClick={() => setActiveImage(src)}
                    aria-label={`Show photo ${idx + 1} of ${farm.name}`}
                    aria-pressed={activeImage === src}
                    className={`aspect-square w-full overflow-hidden rounded-[12px] transition ${
                      activeImage === src
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-canvas'
                        : 'opacity-90 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={src}
                      alt={`${farm.name} at Talawan Global Farms`}
                      className="h-full w-full object-cover"
                    />
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

  return (
    <section id="farms" className="bg-canvas py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-3 md:px-6">
        {/* Header */}
        <div className="mb-14 flex flex-col items-end gap-4 text-right md:mb-16 md:ml-auto md:max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-accent" aria-hidden="true" />
            <span className="text-[13px] font-medium uppercase tracking-[0.16em] text-primary">
              Our Farms
            </span>
          </div>
          <h2 className="font-display text-5xl font-bold leading-[1.1] text-ink sm:text-6xl">
            Four farms.
            <br />
            One family standard.
          </h2>
          <p className="max-w-xl text-justify text-base font-medium leading-relaxed text-ink-soft sm:text-lg">
            Talawan isn't only a poultry brand — it's a small, hands-on
            operation spanning birds, land, and water. Poultry, turkey,
            oil palm, and ducks all answer to the same family, the same
            standard. Tap a farm to see more and send an enquiry.
          </p>
        </div>
      </div>

      {/* Numbered, alternating story list — each division gets a full editorial
          moment: (01) image right / story left, then flips each row down. */}
      <div className="mx-auto max-w-6xl px-3 md:px-6">
        <div className="h-px w-full bg-ink/10" aria-hidden="true" />
        {FARMS.map((farm, i) => {
          const Icon = farm.icon
          const [hero, ...rest] = farm.images
          const number = String(i + 1).padStart(2, '0')
          const imageOnRight = i % 2 === 0

          return (
            <div key={farm.name}>
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

              {i < FARMS.length - 1 && (
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
