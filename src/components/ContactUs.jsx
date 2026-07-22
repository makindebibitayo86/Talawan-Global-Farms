import { useState } from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Phone, Mail, MapPin, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { sendContactMessage } from '../lib/emailjs'
import { saveContactMessage } from '../lib/contactMessages'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Update these with the farm's real details.
const CONTACT_INFO = [
  {
    icon: Phone,
    label: 'Call us',
    values: [
      { text: '0916 530 7582', href: 'tel:+2349165307582' },
      { text: '0808 150 3334', href: 'tel:+2348081503334' },
    ],
  },
  {
    icon: Mail,
    label: 'Email us',
    values: [{ text: 'talawanfarms@gmail.com', href: 'mailto:talawanfarms@gmail.com' }],
  },
  {
    icon: MapPin,
    label: 'Visit the farm',
    values: [
      {
        text: 'Talawan Global Farms, Ibadan, Oyo State, Nigeria',
        href: 'https://maps.google.com/?q=Talawan+Global+Farms+Ibadan+Oyo+State',
      },
    ],
  },
]

// Swap the `q=` value for the farm's real address — this embed works
// without an API key.
const MAP_EMBED_SRC = 'https://www.google.com/maps?q=Lagos,Nigeria&output=embed'

const EMPTY_FORM = { name: '', email: '', message: '' }

// Same variant shapes as AboutUs.jsx, so scroll-in motion feels identical
// across sections rather than reinvented per component.
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

export default function ContactUs() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [status, setStatus] = useState('idle') // idle | sending | success | error

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('sending')

    // Send the email and save the record independently — if Supabase
    // hiccups, the enquiry should still land in the inbox via EmailJS,
    // and vice versa. Only surface an error if both fail.
    const results = await Promise.allSettled([
      sendContactMessage(form),
      saveContactMessage(form),
    ])

    const [emailResult, dbResult] = results
    if (emailResult.status === 'rejected') {
      console.error('Contact form email failed:', emailResult.reason)
    }
    if (dbResult.status === 'rejected') {
      console.error('Contact form save failed:', dbResult.reason)
    }

    if (results.every((r) => r.status === 'rejected')) {
      setStatus('error')
      return
    }

    setStatus('success')
    setForm(EMPTY_FORM)
  }

  return (
    // NOTE: bg-canvas here is a guess to alternate with AboutUs's
    // bg-canvas-alt — swap to match whatever OurFarms/OurProducts
    // actually land on right before this section.
    <section
      id="get-in-touch"
      className="bg-canvas px-3 pb-20 pt-28 md:px-6 md:pb-28 md:pt-40"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid items-stretch gap-16 md:grid-cols-12 md:gap-x-10 lg:gap-x-16">
          {/* Form column */}
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
                Get in Touch
              </span>
            </div>

            <h2 className="max-w-xl font-display text-5xl font-bold leading-[1.1] text-ink sm:text-6xl">
              Got a question?
              <br />
              We're listening.
            </h2>

            <p className="mt-6 max-w-lg text-base font-medium leading-relaxed text-ink-soft sm:text-lg">
              Order enquiries, bulk supply, or a visit to the farm — send a
              note and we'll get back to you shortly.
            </p>

            <form onSubmit={handleSubmit} className="mt-10 max-w-lg space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft"
                >
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className="mt-2 w-full rounded-sm border border-line bg-canvas px-4 py-3 text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="mt-2 w-full rounded-sm border border-line bg-canvas px-4 py-3 text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell us what you're looking for..."
                  className="mt-2 w-full resize-none rounded-sm border border-line bg-canvas px-4 py-3 text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>

              <button
                type="submit"
                disabled={status === 'sending'}
                className={cn(
                  'group inline-flex items-center gap-3 rounded-full bg-primary py-1.5 pl-6 pr-1.5 text-[13px] font-medium uppercase tracking-[0.08em] text-canvas transition-colors hover:bg-primary-dark',
                  status === 'sending' && 'cursor-not-allowed opacity-70'
                )}
              >
                {status === 'sending' ? 'Sending' : 'Send message'}
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-canvas transition-colors group-hover:bg-ink/90">
                  {status === 'sending' ? (
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                  ) : (
                    <Send className="h-4 w-4" strokeWidth={2} />
                  )}
                </span>
              </button>

              {status === 'success' && (
                <p className="flex items-center gap-2 text-sm font-medium text-primary">
                  <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} />
                  Thanks — we've got your message and will be in touch soon.
                </p>
              )}
              {status === 'error' && (
                <p className="flex items-center gap-2 text-sm font-medium text-red-600">
                  <AlertCircle className="h-4 w-4" strokeWidth={1.75} />
                  Something went wrong. Please try again, or reach us on WhatsApp instead.
                </p>
              )}
            </form>
          </motion.div>

          {/* Info + map column */}
          <motion.div
            className="flex h-full min-h-[520px] flex-col gap-6 md:col-span-5 lg:col-span-6"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            variants={fadeInFromRight}
          >
            <div className="flex flex-1 flex-col justify-center rounded-[20px] bg-primary p-8 text-canvas shadow-lg sm:p-10">
              <ul className="space-y-6">
                {CONTACT_INFO.map(({ icon: Icon, label, values }, i) => (
                  <motion.li
                    key={label}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.1 }}
                    variants={fadeUp}
                  >
                    <div className="group flex items-start gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-canvas/10 transition-colors group-hover:bg-canvas/20">
                        <Icon className="h-5 w-5" strokeWidth={1.75} />
                      </span>
                      <span>
                        <span className="block text-[12px] font-medium uppercase tracking-[0.1em] text-canvas/60">
                          {label}
                        </span>
                        <span className="mt-0.5 flex flex-col gap-1">
                          {values.map(({ text, href }) => (
                            <a
                              key={href}
                              href={href}
                              target={href.startsWith('http') ? '_blank' : undefined}
                              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                              className="block text-sm font-medium transition-colors hover:text-canvas/80"
                            >
                              {text}
                            </a>
                          ))}
                        </span>
                      </span>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </div>

            <div className="flex-1 overflow-hidden rounded-[20px] shadow-lg">
              <iframe
                title="Talawan Global Farms location"
                src={MAP_EMBED_SRC}
                className="h-full min-h-[220px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
