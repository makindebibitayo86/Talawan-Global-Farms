import { useEffect, useState } from 'react'
import { Loader2, AlertCircle, CheckCircle2, ArrowUpRight } from 'lucide-react'
import { fetchSectionContent, upsertSectionContent } from '../../lib/siteContent'

const SECTION = 'products'

const PRODUCTS_DEFAULTS = {
  'products.eyebrow': 'Our Products',
  'products.heading': 'What comes off the farm.',
  'products.paragraph':
    'Day-old chicks, table eggs, market-ready birds, palm seedlings, fruit bunches, and pond-raised waterfowl — available for bulk and retail purchase. Tap a product to see more and enquire.',
}

const EYEBROW_FIELD = { key: 'products.eyebrow', label: 'Eyebrow label' }
const HEADING_FIELD = { key: 'products.heading', label: 'Heading' }
const PARAGRAPH_FIELD = { key: 'products.paragraph', label: 'Paragraph', rows: 4 }

// The catalogue itself (individual products, images, details, specs) is
// managed on its own dedicated page — see the "Products" link in the
// sidebar — rather than duplicated here.
const PRODUCTS_ADMIN_PATH = '/admin/products'

export default function ProductsSettingsTab() {
  const [values, setValues] = useState(PRODUCTS_DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('idle') // idle | saving | success | error
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchSectionContent(SECTION, PRODUCTS_DEFAULTS).then((data) => {
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
      <div className="flex items-center gap-2 text-ink-soft">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading products content…
      </div>
    )
  }

  return (
    <div className="rounded-[16px] border border-line bg-canvas p-6">
      <h2 className="mb-5 font-medium text-ink">Products section</h2>

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

        {/* Right column — the product catalogue lives on its own admin
            page, so this just links out rather than duplicating that
            CRUD surface here. */}
        <div className="space-y-5">
          <p className="block text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">Catalogue</p>
          <div className="rounded-[14px] border border-dashed border-ink/20 p-5">
            <p className="text-[13px] leading-relaxed text-ink-soft">
              Individual products — photos, pricing, details, and ordering — are managed on their own page.
            </p>
            <a
              href={PRODUCTS_ADMIN_PATH}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-canvas-alt/60 px-4 py-2.5 text-[13px] font-medium text-ink transition hover:border-primary hover:text-primary"
            >
              Manage individual products
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
            </a>
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-line pt-6">
        {status === 'error' && (
          <p className="mb-4 flex items-center gap-2 text-sm font-medium text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {errorMsg}
          </p>
        )}
        {status === 'success' && (
          <p className="mb-4 flex items-center gap-2 text-sm font-medium text-primary">
            <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            Products section updated.
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
