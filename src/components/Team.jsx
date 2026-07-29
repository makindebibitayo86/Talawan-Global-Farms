import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { fetchSectionContent } from '../lib/siteContent'
import { supabase } from '../lib/supabaseClient'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

const SECTION = 'team'

const TEAM_PHOTO_BUCKET_URL =
  'https://bhcyamtmorvzfckmlhfq.supabase.co/storage/v1/object/public/team-photos/'
const teamPhotoUrl = (filename) => `${TEAM_PHOTO_BUCKET_URL}${filename}`

const fadeSlide = {
  hidden: { opacity: 0, x: 24 },
  show: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
}

// Fallback content — used until Supabase responds, and for any key the
// admin hasn't set yet. Same convention as Hero/About: keys namespaced
// "team.<field>", editable later from a Settings > Team tab once one exists.
const TEAM_DEFAULTS = {
  'team.eyebrow': 'Community',
  'team.heading': 'The People Behind Talawan Global Farms',
  'team.intro':
    'From the fields to the farmhouse, this is the team that keeps Talawan Global Farms running.',
}

export default function Team() {
  const [content, setContent] = useState(TEAM_DEFAULTS)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const count = members.length

  const goTo = (i) => setActiveIndex(i)
  const goNext = () => setActiveIndex((i) => (i + 1) % count)
  const goPrev = () => setActiveIndex((i) => (i - 1 + count) % count)
  const prevIndex = count ? (activeIndex - 1 + count) % count : 0
  const nextIndex = count ? (activeIndex + 1) % count : 0
  const farPrevIndex = count ? (activeIndex - 2 + count) % count : 0
  const farNextIndex = count ? (activeIndex + 2) % count : 0

  useEffect(() => {
    let cancelled = false

    Promise.all([
      fetchSectionContent(SECTION, TEAM_DEFAULTS),
      supabase.from('team_members').select('*').order('sort_order', { ascending: true }),
    ]).then(([contentData, membersRes]) => {
      if (cancelled) return
      setContent(contentData)
      if (!membersRes.error) setMembers(membersRes.data ?? [])
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (count <= 1 || isPaused) return
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % count)
    }, 7000)
    return () => clearInterval(id)
  }, [count, activeIndex, isPaused])

  return (
    <section id="team" className="bg-canvas-alt py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-3 md:px-6">
        {/* Header — same centered, double-line eyebrow treatment as Gallery/Our Farms */}
        <div className="mx-auto mb-14 flex max-w-2xl flex-col items-center gap-4 text-center md:mb-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-accent" aria-hidden="true" />
            <span className="text-[13px] font-medium uppercase tracking-[0.16em] text-primary">
              {content['team.eyebrow']}
            </span>
            <span className="h-px w-10 bg-accent" aria-hidden="true" />
          </div>
          <h2 className="font-display text-5xl font-bold leading-[1.1] text-ink sm:text-6xl">
            {content['team.heading']}
          </h2>
          <p className="max-w-none whitespace-nowrap text-center text-base font-medium leading-relaxed text-ink-soft sm:text-lg">
            {content['team.intro']}
          </p>
        </div>

        {/* Team carousel — centered "peek" slider */}
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-ink-soft">
            <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.75} />
            <span className="text-[14px] font-medium">Loading team…</span>
          </div>
        ) : count === 0 ? (
          <div className="flex items-center justify-center gap-2 py-20 text-ink-soft">
            <Users className="h-5 w-5" strokeWidth={1.75} />
            <span className="text-[14px] font-medium">Team profiles coming soon.</span>
          </div>
        ) : (
          <div className="mx-auto w-full">
            {/* Prev / center / next images — each keyed by its actual member
                index (not by screen position), so when the active index
                changes, the slide that was "next" smoothly grows and slides
                into the "center" slot via framer-motion's shared layout
                animation, rather than just popping into place. Far peeks
                only show on md+ where there's room for 5 across. */}
            <div
              className="flex items-center justify-center gap-1.5 md:gap-2.5"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {[
                { pos: 'farPrev', idx: farPrevIndex },
                { pos: 'prev', idx: prevIndex },
                { pos: 'center', idx: activeIndex },
                { pos: 'next', idx: nextIndex },
                { pos: 'farNext', idx: farNextIndex },
              ].map(({ pos, idx }) => (
                <motion.button
                  key={members[idx].id}
                  type="button"
                  layout
                  onClick={() => goTo(idx)}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  aria-label={pos === 'center' ? undefined : `Show ${members[idx].name}`}
                  className={cn(
                    'relative shrink-0 overflow-hidden rounded-[24px] bg-ink/10 transition-opacity duration-300',
                    pos === 'center' &&
                      'z-20 h-96 w-64 opacity-100 sm:h-[28rem] sm:w-80',
                    pos !== 'center' &&
                      pos !== 'farPrev' &&
                      pos !== 'farNext' &&
                      'z-10 h-80 w-48 cursor-pointer opacity-45 hover:opacity-70 sm:h-96 sm:w-64',
                    (pos === 'farPrev' || pos === 'farNext') &&
                      'hidden h-64 w-36 cursor-pointer opacity-20 hover:opacity-40 md:flex md:h-80 md:w-48'
                  )}
                >
                  {members[idx].photo_filename ? (
                    <img
                      src={teamPhotoUrl(members[idx].photo_filename)}
                      alt={members[idx].name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      <Users
                        className={cn('text-ink/25', pos === 'center' ? 'h-24 w-24' : 'h-11 w-11')}
                        strokeWidth={1.5}
                      />
                    </span>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Write-up — sits under the centered image. This block is a
                FIXED height (not min-height), and the bio paragraph itself
                reserves exactly 6 lines of space regardless of how long the
                actual text is. That's what stops the section from growing
                or shrinking as you page through members with shorter or
                longer bios — a short bio just leaves blank space below it,
                a long one clips with an ellipsis, but the box itself never
                moves. */}
            <div className="relative mt-8 h-[260px] text-center sm:h-[280px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`bio-${activeIndex}`}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  variants={fadeSlide}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                  <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-accent-dark">
                    {members[activeIndex].role}
                  </span>
                  <h3 className="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">
                    {members[activeIndex].name}
                  </h3>
                  <p
                    className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-ink-soft"
                    style={{
                      height: '9.75rem', // exactly 6 lines at leading-relaxed (1.625) × text-base (1rem)
                      display: '-webkit-box',
                      WebkitLineClamp: 6,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      whiteSpace: 'pre-line', // respects line breaks typed in the admin bio field
                    }}
                  >
                    {members[activeIndex].bio}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Nav row — Prev button, dots, Next button, all together */}
            <div className="mt-8 flex items-center justify-center gap-5">
              <button
                type="button"
                onClick={goPrev}
                aria-label="Previous team member"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-canvas text-ink shadow-sm transition hover:border-primary hover:text-primary"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2} />
              </button>

              <div className="flex items-center gap-2">
                {members.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`Go to team member ${i + 1}`}
                    aria-current={i === activeIndex}
                    className={cn(
                      'h-2 rounded-full transition-all duration-300',
                      i === activeIndex ? 'w-6 bg-primary' : 'w-2 bg-ink/20 hover:bg-ink/35'
                    )}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={goNext}
                aria-label="Next team member"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-canvas text-ink shadow-sm transition hover:border-primary hover:text-primary"
              >
                <ChevronRight className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
