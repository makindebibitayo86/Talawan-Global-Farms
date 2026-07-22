import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

const FOUNDING_YEAR = 1989
const yearsFarming = new Date().getFullYear() - FOUNDING_YEAR

const STATS = [
  { value: `${yearsFarming}`, label: 'Years farming' },
  { value: '2M+', label: 'Birds raised yearly' },
  { value: '4', label: 'Farm divisions' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

const fadeInFromLeft = {
  hidden: { opacity: 0, x: -40 },
  show: { opacity: 1, x: 0 },
}

const fadeInFromRight = {
  hidden: { opacity: 0, x: 40 },
  show: { opacity: 1, x: 0 },
}

// Images now live in Supabase Storage (public "farm-images" bucket) instead
// of the codebase — same filenames OurFarms.jsx can draw from too.
const SUPABASE_STORAGE_URL =
  'https://bhcyamtmorvzfckmlhfq.supabase.co/storage/v1/object/public/farm-images/'

// Four equally-weighted shots — half crop, half livestock, so the collage
// reads as one mixed farm rather than "mostly poultry" or "mostly palm".
const COLLAGE = [
  {
    src: `${SUPABASE_STORAGE_URL}farm-oilpalm-tree.jpg`,
    alt: 'Oil palm growing on the Talawan plantation',
  },
  {
    src: `${SUPABASE_STORAGE_URL}farm-poultry-layers.jpg`,
    alt: 'Layer hens inside a Talawan poultry house',
  },
  {
    src: `${SUPABASE_STORAGE_URL}farm-ducks.jpg`,
    alt: 'Ducks and geese at the Talawan pond',
  },
  {
    src: `${SUPABASE_STORAGE_URL}farm-oilpalm-fruit.jpg`,
    alt: 'Freshly harvested oil palm fruit bunches at Talawan',
  },
]

export default function AboutUs() {
  return (
    <section
      id="about"
      className="bg-canvas-alt px-3 pb-20 pt-28 md:px-6 md:pb-28 md:pt-40"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-16 md:grid-cols-12 md:gap-x-10 lg:gap-x-16">
          {/* Text column */}
          <motion.div
            className="md:col-span-7 lg:col-span-6"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            variants={fadeInFromLeft}
          >
            {/* Eyebrow */}
            <div className="mb-6 flex items-center gap-3">
              <span className="h-px w-10 bg-accent" aria-hidden="true" />
              <span className="text-[13px] font-medium uppercase tracking-[0.16em] text-primary">
                About Talawan
              </span>
            </div>

            <h2 className="max-w-xl font-display text-5xl font-bold leading-[1.1] text-ink sm:text-6xl">
              Decades in the making.
              <br />
              Built for what's next.
            </h2>

            <p className="mt-6 max-w-lg text-justify text-base font-medium leading-relaxed text-ink-soft sm:text-lg">
              Talawan has worked this land for decades, passing through
              different hands along the way. What's stayed constant is the
              mix — livestock and oil palm, side by side, never just one or
              the other. What's changing now is how we run it: bringing in
              the tools and systems to take that same foundation further,
              faster, and further afield.
            </p>

            {/* Stats */}
            <dl className="mx-auto mt-10 flex max-w-lg justify-center divide-x divide-line md:mx-0 md:justify-start">
              {STATS.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  className={cn(
                    'flex flex-1 flex-col items-center px-5 text-center first:pl-5 md:items-start md:px-5 md:text-left md:first:pl-0'
                  )}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.5, ease: 'easeOut', delay: 0.7 + i * 0.1 }}
                  variants={fadeUp}
                >
                  <dt className="font-hero text-4xl leading-none text-primary sm:text-5xl">
                    {stat.value}
                  </dt>
                  <dd className="mt-2 text-[12px] uppercase tracking-[0.1em] text-ink-soft">
                    {stat.label}
                  </dd>
                </motion.div>
              ))}
            </dl>
          </motion.div>

          {/* Image column */}
          <motion.div
            className="relative md:col-span-5 lg:col-span-6"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            variants={fadeInFromRight}
          >
            <div className="grid grid-cols-2 gap-3">
              {COLLAGE.map((photo, i) => (
                <motion.div
                  key={photo.src}
                  className="overflow-hidden rounded-[20px] shadow-lg"
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.1 }}
                  variants={fadeUp}
                >
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    className="aspect-square w-full object-cover"
                  />
                </motion.div>
              ))}
            </div>

            {/* Heritage seal — a quieter cousin of the hero's rotating ring:
                same circular-text device, static this time, so the page's
                one bold motion moment stays with the hero. Top and bottom
                labels each ride their own arc, centered with text-anchor
                + startOffset 50%, so spacing is exactly even on both sides
                no matter how long the text is. */}
            <div
              className="absolute -bottom-8 -left-6 flex h-28 w-28 items-center justify-center rounded-full bg-primary text-canvas shadow-lg ring-4 ring-canvas-alt sm:h-32 sm:w-32 md:-left-10"
              aria-hidden="true"
            >
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
                <defs>
                  {/* Upper arc: spans 200°, centered on the top vertex (50,14) */}
                  <path id="about-seal-top" d="M 14.55,56.25 A 36,36 0 1,1 85.45,56.25" />
                  {/* Lower arc: spans 140°, centered on the bottom vertex (50,86) */}
                  <path id="about-seal-bottom" d="M 16.17,62.31 A 36,36 0 0,0 83.83,62.31" />
                </defs>
                <text fill="currentColor" fontSize="6.7" letterSpacing="1.1">
                  <textPath href="#about-seal-top" startOffset="50%" textAnchor="middle">
                    TALAWAN GLOBAL FARMS
                  </textPath>
                </text>
                <text fill="currentColor" fontSize="5.4" letterSpacing="0.8">
                  <textPath href="#about-seal-bottom" startOffset="50%" textAnchor="middle">
                    FEEDING THE NATION
                  </textPath>
                </text>
              </svg>
              <span className="flex flex-col items-center font-hero text-base leading-[0.95] tracking-wide">
                <span className="text-[11px] tracking-[0.2em] opacity-90">SINCE</span>
                <span className="text-xl">{FOUNDING_YEAR}</span>
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
