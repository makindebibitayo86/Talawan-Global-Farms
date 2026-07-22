import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, MessageCircle, ArrowUpRight, Egg, Bird, TreePalm, Waves } from 'lucide-react'
import { buildWhatsAppLink } from '../lib/whatsapp'

// Product photos live in Supabase Storage (public "farm-images" bucket)
// rather than the codebase — img() resolves a filename to its public URL.
const SUPABASE_STORAGE_URL =
  'https://bhcyamtmorvzfckmlhfq.supabase.co/storage/v1/object/public/farm-images/'
const img = (filename) => `${SUPABASE_STORAGE_URL}${filename}`

const PRODUCTS = [
  {
    name: 'Day-Old Chicks',
    category: 'Poultry',
    icon: Egg,
    tagline: 'Freshly hatched, ready to rear',
    description:
      'Healthy day-old chicks straight from our brooder house — sold in bulk to farmers, hatcheries, and growers building out their own flocks.',
    details: ['Broiler & layer breeds', 'Available in bulk quantities', 'Handled with care from hatch to crate'],
    specs: [
      { label: 'Breed options', value: 'Broiler & layer' },
      { label: 'Order type', value: 'Bulk & wholesale' },
      { label: 'Availability', value: 'Contact for current stock' },
      { label: 'Source', value: 'Our own brooder house' },
    ],
    image: img('farm-poultry-dayold.jpg'),
  },
  {
    name: 'Broiler Chickens',
    category: 'Poultry',
    icon: Egg,
    tagline: 'Raised to table weight',
    description:
      'Broilers raised on a consistent feeding programme from chick to market size, sold live or by pre-order for bulk buyers.',
    details: ['Raised to market weight', 'Live sales & pre-orders', 'Consistent feeding programme'],
    specs: [
      { label: 'Weight range', value: 'Market-ready' },
      { label: 'Order type', value: 'Live sales & pre-order' },
      { label: 'Feeding programme', value: 'Consistent, monitored' },
      { label: 'Availability', value: 'Contact for current stock' },
    ],
    image: img('broiler-chickens.jpg'), // not yet uploaded — see note below
  },
  {
    name: 'Table Eggs',
    category: 'Poultry',
    icon: Egg,
    tagline: 'From our layer flock',
    description:
      'Fresh eggs collected daily from actively laying hens, available for wholesale crates or retail quantities.',
    details: ['Collected daily', 'Wholesale & retail crates', 'From a healthy, well-managed flock'],
    specs: [
      { label: 'Crate size', value: 'Standard wholesale crates' },
      { label: 'Order type', value: 'Wholesale & retail' },
      { label: 'Collection', value: 'Daily' },
      { label: 'Availability', value: 'Year-round' },
    ],
    image: img('eggs-crates.jpg'), // not yet uploaded — see note below
  },
  {
    name: 'Spent Layers',
    category: 'Poultry',
    icon: Egg,
    tagline: 'End-of-lay hens, sold on',
    description:
      'Hens past their peak laying cycle, sold on for meat once egg production winds down — a common secondary product from the layer flock.',
    details: ['Sold after peak laying cycle', 'Available in bulk', 'Good value for meat buyers'],
    specs: [
      { label: 'Stage', value: 'Post peak-lay' },
      { label: 'Order type', value: 'Bulk sales' },
      { label: 'Best for', value: 'Meat processing & buyers' },
      { label: 'Availability', value: 'Seasonal, by flock cycle' },
    ],
    image: img('farm-poultry-layers.jpg'),
  },
  {
    name: 'Turkey',
    category: 'Turkey',
    icon: Bird,
    tagline: 'Farm-raised, market-ready',
    description:
      'Turkeys reared under open housing and finished to full market weight — sold live or by pre-order for the season.',
    details: ['Market-ready weight', 'Live sales & pre-orders', 'Raised on an open feeding programme'],
    specs: [
      { label: 'Weight class', value: 'Market-ready' },
      { label: 'Order type', value: 'Live sales & pre-order' },
      { label: 'Season', value: 'Available seasonally & on request' },
      { label: 'Housing', value: 'Open-house rearing' },
    ],
    image: img('farm-turkey.jpg'), // currently missing from bucket — see note below
  },
  {
    name: 'Palm Seedlings',
    category: 'Oil Palm Plantation',
    icon: TreePalm,
    tagline: 'Nursery-raised & field-ready',
    description:
      'Greenhouse-raised oil palm seedlings ready for transplanting, sold to growers expanding or starting their own plantation.',
    details: ['Greenhouse-raised', 'Field-ready at time of sale', 'Sold individually or in bulk'],
    specs: [
      { label: 'Stage', value: 'Field-ready' },
      { label: 'Order type', value: 'Individual or bulk' },
      { label: 'Source', value: 'Greenhouse nursery' },
      { label: 'Availability', value: 'Contact for current stock' },
    ],
    image: img('farm-oilpalm-nursery.jpg'),
  },
  {
    name: 'Oil Palm Fruit Bunches',
    category: 'Oil Palm Plantation',
    icon: TreePalm,
    tagline: 'Harvested & trade-ready',
    description:
      'Fresh fruit bunches harvested from our own plantation, available for direct trade to mills and buyers.',
    details: ['Harvested on schedule', 'Sold by the bunch or in bulk', 'Direct plantation-to-buyer trade'],
    specs: [
      { label: 'Harvest', value: 'Scheduled harvest' },
      { label: 'Order type', value: 'Direct trade, bulk' },
      { label: 'Buyers', value: 'Mills & bulk buyers' },
      { label: 'Source', value: 'Our own plantation' },
    ],
    image: img('farm-oilpalm-fruit.jpg'),
  },
  {
    name: 'Ducks & Geese',
    category: 'Duck Farming',
    icon: Waves,
    tagline: 'Pond-raised waterfowl',
    description:
      'Live ducks and geese raised on open water and pasture, sold to farmers and buyers looking for pond-raised stock.',
    details: ['Pond & pasture-raised', 'Sold live', 'Ducks & geese available'],
    specs: [
      { label: 'Stock', value: 'Ducks & geese' },
      { label: 'Order type', value: 'Live sales' },
      { label: 'Habitat', value: 'Pond & pasture-raised' },
      { label: 'Availability', value: 'Contact for current stock' },
    ],
    image: img('farm-ducks.jpg'),
  },
]

const cardReveal = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
}

function ProductModal({ product, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  if (!product) return null

  const Icon = product.icon
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
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover"
          />
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

  return (
    <section id="products" className="bg-canvas-alt py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-3 md:px-6">
        {/* Header — mirrors Our Farms but left-aligned, so the two sections
            read as a pair without feeling identical. */}
        <div className="mb-12 flex flex-col gap-4 md:mb-16 md:max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-accent" aria-hidden="true" />
            <span className="text-[13px] font-medium uppercase tracking-[0.16em] text-primary">
              Our Products
            </span>
          </div>
          <h2 className="font-display text-5xl font-bold leading-[1.1] text-ink sm:whitespace-nowrap sm:text-6xl">
            What comes off the farm.
          </h2>
          <p className="max-w-xl text-base font-medium leading-relaxed text-ink-soft sm:text-lg">
            Day-old chicks, table eggs, market-ready birds, palm seedlings,
            fruit bunches, and pond-raised waterfowl — available for bulk
            and retail purchase. Tap a product to see more and enquire.
          </p>
        </div>

        {/* Catalog grid — a deliberately different rhythm from the Our Farms
            horizontal scroll, since this is a browsable list, not a journey. */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
          {PRODUCTS.map((product, i) => (
            <motion.button
              key={product.name}
              type="button"
              onClick={() => setActiveProduct(product)}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: (i % 4) * 0.08 }}
              variants={cardReveal}
              className="group flex flex-col text-left"
            >
              <div className="relative overflow-hidden rounded-[20px]">
                <img
                  src={product.image}
                  alt={product.name}
                  className="aspect-square w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
                />
                <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-canvas/90 text-primary opacity-0 shadow-sm backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                </span>
              </div>
              <h3 className="mt-3 font-display text-base font-semibold text-ink sm:text-lg">
                {product.name}
              </h3>
              <span className="mt-0.5 text-[12px] font-medium uppercase tracking-[0.06em] text-accent-dark sm:text-[13px]">
                {product.tagline}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {activeProduct && (
          <ProductModal product={activeProduct} onClose={() => setActiveProduct(null)} />
        )}
      </AnimatePresence>
    </section>
  )
}
