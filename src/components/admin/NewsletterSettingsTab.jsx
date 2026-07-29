import { useEffect, useState } from 'react'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { fetchSectionContent, upsertSectionContent } from '../../lib/siteContent'

const SECTION = 'newsletter'

// Mirrors what's currently hardcoded in Newsletter.jsx, so the first admin
// load shows exactly what's already live on the site.
const NEWSLETTER_DEFAULTS = {
  'newsletter.eyebrow': 'Stay Connected',
  'newsletter.heading': 'Get farm updates & export alerts',
  'newsletter.paragraph':
    "We keep a short list of buyers and partners informed as things change on the farm — new harvests coming in, product availability, export pricing, and any seasonal shifts that might affect your order.\nSubscribe and we'll only reach out when there's something worth knowing.\nNo spam, unsubscribe anytime.",
}

const EYEBROW_FIELD = { key: 'newsletter.eyebrow', label: 'Eyebrow label' }
const HEADING_FIELD = { key: 'newsletter.heading', label: 'Heading' }
const PARAGRAPH_FIELD = { key: 'newsletter.paragraph', label: 'Paragraph', rows: 5 }

export default function NewsletterSettingsTab() {
  const [values, setValues] = useState(NEWSLETTER_DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('idle') // idle | saving | success | error
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchSectionContent(SECTION, NEWSLETTER_DEFAULTS).then((data) => {
      if (cancelled) return
      setValues(data)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  function handleChange(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }))
    setStatus('idle')
  }

  async function handleSave() {
    setStatus('saving')
    setErrorMsg('')
    try {
      const textEntries = [EYEBROW_FIELD, HEADING_FIELD, PARAGRAPH_FIELD].map(({ key }) => ({
        key,
        value: values[key],
        type: 'text',
      }))

      await upsertSectionContent(textEntries, SECTION)
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message || 'Failed to save changes.')
    }
  }

  if (loading) {
    return (
      <div className="rounded-[16px] border border-line glass-panel p-6">
        <div className="flex items-center gap-2 text-ink-soft">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading newsletter content…
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-[16px] border border-line glass-panel p-6">
      <h2 className="mb-5 font-medium text-ink">Newsletter section</h2>

      <div className="space-y-5">
        <div>
          <label className="block text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
            {EYEBROW_FIELD.label}
          </label>
          <input
            type="text"
            value={values[EYEBROW_FIELD.key]}
            onChange={(e) => handleChange(EYEBROW_FIELD.key, e.target.value)}
            className="mt-2 w-full rounded-sm border border-line bg-canvas-alt/60 px-4 py-3 text-ink outline-none transition focus:border-primary focus:bg-canvas focus:ring-4 focus:ring-primary/10"
          />
        </div>

        <div>
          <label className="block text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
            {HEADING_FIELD.label}
          </label>
          <input
            type="text"
            value={values[HEADING_FIELD.key]}
            onChange={(e) => handleChange(HEADING_FIELD.key, e.target.value)}
            className="mt-2 w-full rounded-sm border border-line bg-canvas-alt/60 px-4 py-3 text-ink outline-none transition focus:border-primary focus:bg-canvas focus:ring-4 focus:ring-primary/10"
          />
          <p className="mt-1 text-[12px] text-ink-soft">
            Kept on one line on desktop — keep it short so it doesn't wrap.
          </p>
        </div>

        <div>
          <label className="block text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
            {PARAGRAPH_FIELD.label}
          </label>
          <textarea
            rows={PARAGRAPH_FIELD.rows}
            value={values[PARAGRAPH_FIELD.key]}
            onChange={(e) => handleChange(PARAGRAPH_FIELD.key, e.target.value)}
            className="mt-2 w-full resize-y rounded-sm border border-line bg-canvas-alt/60 px-4 py-3 text-ink outline-none transition focus:border-primary focus:bg-canvas focus:ring-4 focus:ring-primary/10"
          />
          <p className="mt-1 text-[12px] text-ink-soft">Start a new line to control where the paragraph breaks.</p>
        </div>
      </div>

      <div className="mt-6 border-t border-line pt-6">
        {status === 'error' && (
          <p className="mb-4 flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {errorMsg}
          </p>
        )}
        {status === 'success' && (
          <p className="mb-4 flex items-center gap-2 text-sm font-medium text-primary">
            <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            Newsletter section updated.
          </p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={status === 'saving'}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-[13px] font-medium uppercase tracking-[0.08em] text-canvas transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70 lg:w-auto lg:px-10"
        >
          {status === 'saving' && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
          {status === 'saving' ? 'Saving' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
