import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { fetchSectionContent } from '../lib/siteContent'

const SECTION = 'newsletter'

// Mirrors what's currently hardcoded on the site — first paint fallback
// and the defaults shown in NewsletterSettingsTab.jsx before a row exists.
const NEWSLETTER_DEFAULTS = {
  'newsletter.eyebrow': 'Stay Connected',
  'newsletter.heading': 'Get farm updates & export alerts',
  'newsletter.paragraph':
    "We keep a short list of buyers and partners informed as things change on the farm — new harvests coming in, product availability, export pricing, and any seasonal shifts that might affect your order.\nSubscribe and we'll only reach out when there's something worth knowing.\nNo spam, unsubscribe anytime.",
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('')
  const [content, setContent] = useState(NEWSLETTER_DEFAULTS)

  useEffect(() => {
    let cancelled = false
    fetchSectionContent(SECTION, NEWSLETTER_DEFAULTS).then((data) => {
      if (!cancelled) setContent(data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Auto-clear the success/error message a few seconds after it appears,
  // same convention as ContactUs.jsx.
  useEffect(() => {
    if (status !== 'success' && status !== 'error') return
    const timeout = setTimeout(() => setStatus('idle'), 8000)
    return () => clearTimeout(timeout)
  }, [status])

  const eyebrow = content['newsletter.eyebrow']
  const heading = content['newsletter.heading']
  const paragraphLines = content['newsletter.paragraph'].split('\n')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return

    setStatus('loading')
    setErrorMsg('')

    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email: trimmed })

    if (error) {
      setErrorMsg(
        error.code === '23505'
          ? "You're already subscribed."
          : 'Something went wrong. Please try again.'
      )
      setStatus('error')
      return
    }

    setStatus('success')
    setEmail('')
  }

  return (
    <section className="bg-primary px-3 py-24 text-canvas md:py-32">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          variants={fadeUp}
          className="flex flex-col items-center gap-10 text-center"
        >
          {/* Eyebrow — same treatment as ContactUs */}
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-accent" aria-hidden="true" />
            <span className="text-[13px] font-medium uppercase tracking-[0.16em] text-canvas/80">
              {eyebrow}
            </span>
            <span className="h-px w-10 bg-accent" aria-hidden="true" />
          </div>

          <div className="max-w-3xl md:max-w-none">
            <h2 className="font-display font-bold leading-[1.1] text-canvas text-[clamp(1.75rem,4.5vw,3.5rem)] md:whitespace-nowrap">
              {heading}
            </h2>
          </div>

          <div className="w-full max-w-2xl">
            <p className="text-base font-medium leading-relaxed text-canvas/80 sm:text-lg">
              {paragraphLines.map((line, idx) => (
                <span key={idx}>
                  {line}
                  {idx < paragraphLines.length - 1 && <br />}
                </span>
              ))}
            </p>
          </div>

          <div className="w-full max-w-md">
            {status === 'success' ? (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 text-sm font-medium text-canvas"
              >
                <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} />
                You're subscribed — thanks for joining.
              </motion.p>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3" noValidate>
                <div className="relative w-full">
                  <Mail
                    className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-canvas/50"
                    strokeWidth={1.75}
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    disabled={status === 'loading'}
                    className="w-full rounded-full border border-canvas/30 bg-canvas/10 py-3 pl-11 pr-4 text-sm text-canvas outline-none transition placeholder:text-canvas/50 focus:border-canvas focus:ring-4 focus:ring-canvas/10 disabled:opacity-60"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="inline-flex w-fit items-center justify-center gap-2 whitespace-nowrap rounded-full bg-canvas px-5 py-2 text-[12px] font-medium uppercase tracking-[0.08em] text-primary transition-colors hover:bg-canvas/90 disabled:opacity-60"
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                      Subscribing
                    </>
                  ) : (
                    'Subscribe'
                  )}
                </button>
              </form>
            )}

            {status === 'error' && (
              <p className="mt-3 flex items-center justify-center gap-2 text-sm font-medium text-canvas">
                <AlertCircle className="h-4 w-4" strokeWidth={1.75} />
                {errorMsg}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
