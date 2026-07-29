import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Phone, Mail, MapPin, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { sendContactMessage } from '../lib/emailjs'
import { saveContactMessage } from '../lib/contactMessages'
import { fetchSectionContent } from '../lib/siteContent'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

const SECTION = 'contact'

// Same values as the admin defaults in ContactSettingsTab.jsx — keeps this
// section looking right on first paint, before the site_content fetch
// resolves, and acts as the fallback if a row is ever missing.
const CONTACT_DEFAULTS = {
  'contact.eyebrow': 'Get in Touch',
  'contact.heading': "Got a question?\nWe're listening.",
  'contact.paragraph':
    "Order enquiries, bulk supply, or a visit to the farm — send a note and we'll get back to you shortly.",
  'contact.phones': JSON.stringify(['0916 530 7582', '0808 150 3334']),
  'contact.email': 'talawanfarms@gmail.com',
  'contact.address': 'Talawan Global Farms, Ibadan, Oyo State, Nigeria',
  'contact.map_query': 'Talawan+Global+Farms+Ibadan+Oyo+State',
}

function safeParseArray(value) {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// Turns a local Nigerian number like "0916 530 7582" into "+2349165307582"
// for the tel: link — same convention the previous hardcoded hrefs used.
function toTelHref(phone) {
  const digits = phone.replace(/\D/g, '')
  const withoutLeadingZero = digits.replace(/^0/, '')
  return `tel:+234${withoutLeadingZero}`
}

const EMPTY_FORM = { name: '', email: '', phone: '', message: '' }

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
  const [validationError, setValidationError] = useState('')
  const [content, setContent] = useState(CONTACT_DEFAULTS)

  useEffect(() => {
    let cancelled = false
    fetchSectionContent(SECTION, CONTACT_DEFAULTS).then((data) => {
      if (!cancelled) setContent(data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Auto-clear the success/error message a few seconds after it appears,
  // so it doesn't sit there indefinitely once the form has already reset.
  useEffect(() => {
    if (status !== 'success' && status !== 'error') return
    const timeout = setTimeout(() => setStatus('idle'), 8000)
    return () => clearTimeout(timeout)
  }, [status])

  const eyebrow = content['contact.eyebrow']
  const headingLines = content['contact.heading'].split('\n')
  const paragraph = content['contact.paragraph']
  const phones = safeParseArray(content['contact.phones'])
  const email = content['contact.email']
  const address = content['contact.address']
  const mapQuery = content['contact.map_query']

  const CONTACT_INFO = [
    {
      icon: Phone,
      label: 'Call us',
      values: phones.map((text) => ({ text, href: toTelHref(text) })),
    },
    {
      icon: Mail,
      label: 'Email us',
      values: [{ text: email, href: `mailto:${email}` }],
    },
    {
      icon: MapPin,
      label: 'Visit the farm',
      values: [{ text: address, href: `https://maps.google.com/?q=${mapQuery}` }],
    },
  ]

  const mapEmbedSrc = `https://www.google.com/maps?q=${mapQuery}&output=embed`

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if ((name === 'email' || name === 'phone') && value.trim()) {
      setValidationError('')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!form.email.trim() && !form.phone.trim()) {
      setValidationError('Please provide an email or phone number so we can get back to you.')
      return
    }
    setValidationError('')
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
                {eyebrow}
              </span>
            </div>

            <h2 className="max-w-xl font-display text-5xl font-bold leading-[1.1] text-ink sm:text-6xl">
              {headingLines.map((line, idx) => (
                <span key={idx}>
                  {line}
                  {idx < headingLines.length - 1 && <br />}
                </span>
              ))}
            </h2>

            <p className="mt-6 max-w-lg text-base font-medium leading-relaxed text-ink-soft sm:text-lg">
              {paragraph}
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
                  Email <span className="normal-case text-ink-soft/60">(or phone below)</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="mt-2 w-full rounded-sm border border-line bg-canvas px-4 py-3 text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft"
                >
                  Phone <span className="normal-case text-ink-soft/60">(or email above)</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="080X XXX XXXX"
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

              {validationError && (
                <p className="flex items-center gap-2 text-sm font-medium text-red-600">
                  <AlertCircle className="h-4 w-4" strokeWidth={1.75} />
                  {validationError}
                </p>
              )}

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
                src={mapEmbedSrc}
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
