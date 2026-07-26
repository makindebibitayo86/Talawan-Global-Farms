import { useEffect, useState } from 'react'
import { Loader2, AlertCircle, CheckCircle2, ArrowUpRight } from 'lucide-react'
import { fetchSectionContent, upsertSectionContent } from '../../lib/siteContent'

const SECTION = 'gallery'

const GALLERY_DEFAULTS = {
  'gallery.eyebrow': 'Gallery',
  'gallery.heading': 'A look into our world',
  'gallery.paragraph': 'From sunrise in the fields to the products that make it to your table.',
}

const EYEBROW_FIELD = { key: 'gallery.eyebrow', label: 'Eyebrow label' }
const HEADING_FIELD = { key: 'gallery.heading', label: 'Heading' }
const PARAGRAPH_FIELD = { key: 'gallery.paragraph', label: 'Paragraph', rows: 3 }

// Gallery photos themselves are managed on their own dedicated page — see
// the "Gallery" link in the sidebar — rather than duplicated here.
const GALLERY_ADMIN_PATH = '/admin/gallery'

export default function GallerySettingsTab() {
  const [values, setValues] = useState(GALLERY_DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('idle') // idle | saving | success | error
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchSectionContent(SECTION, GALLERY_DEFAULTS).then((data) => {
      if (!cancelled) {
        setValues(data)
        setLoading(false)
      }
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
          Loading gallery content…
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-[16px] border border-line glass-panel p-6">
      <h2 className="mb-5 font-medium text-ink">Gallery section</h2>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left column — copy */}
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
          </div>

          <div>
            <label className="block text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
              {PARAGRAPH_FIELD.label}
            </label>
            <textarea
              rows={PARAGRAPH_FIELD.rows}
              value={values[PARAGRAPH_FIELD.key]}
              onChange={(e) => handleChange(PARAGRAPH_FIELD.key, e.target.value)}
              className="mt-2 w-full rounded-sm border border-line bg-canvas-alt/60 px-4 py-3 text-ink outline-none transition focus:border-primary focus:bg-canvas focus:ring-4 focus:ring-primary/10"
            />
          </div>
        </div>

        {/* Right column — gallery photos live on their own admin page, so
            this just links out rather than duplicating that surface here. */}
        <div className="space-y-5">
          <p className="block text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">Photos</p>
          <div className="rounded-[14px] border border-dashed border-ink/20 p-5">
            <p className="text-[13px] leading-relaxed text-ink-soft">
              Gallery photos are managed on their own page, separate from this section's copy.
            </p>
            <a
              href={GALLERY_ADMIN_PATH}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-canvas-alt/60 px-4 py-2.5 text-[13px] font-medium text-ink transition hover:border-primary hover:text-primary"
            >
              Manage gallery photos
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
            </a>
          </div>
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
            Gallery section updated.
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
