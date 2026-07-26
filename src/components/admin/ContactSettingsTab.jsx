import { useEffect, useState } from 'react'
import { Loader2, AlertCircle, CheckCircle2, Plus, X } from 'lucide-react'
import { fetchSectionContent, upsertSectionContent } from '../../lib/siteContent'

const SECTION = 'contact'

// Mirrors what's currently hardcoded in ContactUs.jsx, so the first admin
// load shows exactly what's already live on the site.
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

const EYEBROW_FIELD = { key: 'contact.eyebrow', label: 'Eyebrow label' }
const HEADING_FIELD = { key: 'contact.heading', label: 'Heading' }
const PARAGRAPH_FIELD = { key: 'contact.paragraph', label: 'Paragraph', rows: 3 }
const EMAIL_FIELD = { key: 'contact.email', label: 'Email address' }
const ADDRESS_FIELD = { key: 'contact.address', label: 'Address (as displayed)' }
const MAP_QUERY_FIELD = { key: 'contact.map_query', label: 'Map search query' }

function safeParseArray(value) {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// Same inline add/remove list editor used for Farms' process/products —
// kept local here since it isn't shared out of that file.
function StringListEditor({ label, items, onChange, placeholder }) {
  function updateAt(idx, value) {
    const next = [...items]
    next[idx] = value
    onChange(next)
  }
  function removeAt(idx) {
    onChange(items.filter((_, i) => i !== idx))
  }
  function add() {
    onChange([...items, ''])
  }

  return (
    <div>
      <span className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">{label}</span>
      <div className="mt-2 space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              value={item}
              onChange={(e) => updateAt(idx, e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-sm border border-line bg-canvas-alt/60 px-3 py-2 text-[14px] text-ink outline-none transition focus:border-primary focus:bg-canvas focus:ring-4 focus:ring-primary/10"
            />
            <button
              type="button"
              onClick={() => removeAt(idx)}
              aria-label={`Remove ${label.toLowerCase()} item`}
              className="shrink-0 rounded-full p-1.5 text-ink-soft transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-primary transition-colors hover:text-primary-dark"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
        Add number
      </button>
    </div>
  )
}

export default function ContactSettingsTab() {
  const [values, setValues] = useState(CONTACT_DEFAULTS)
  const [phones, setPhones] = useState(() => safeParseArray(CONTACT_DEFAULTS['contact.phones']))
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('idle') // idle | saving | success | error
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchSectionContent(SECTION, CONTACT_DEFAULTS).then((data) => {
      if (cancelled) return
      setValues(data)
      setPhones(safeParseArray(data['contact.phones']))
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

  function handlePhonesChange(next) {
    setPhones(next)
    setStatus('idle')
  }

  async function handleSave() {
    setStatus('saving')
    setErrorMsg('')
    try {
      const textEntries = [
        EYEBROW_FIELD,
        HEADING_FIELD,
        PARAGRAPH_FIELD,
        EMAIL_FIELD,
        ADDRESS_FIELD,
        MAP_QUERY_FIELD,
      ].map(({ key }) => ({ key, value: values[key], type: 'text' }))

      textEntries.push({
        key: 'contact.phones',
        value: JSON.stringify(phones.filter((p) => p.trim() !== '')),
        type: 'text',
      })

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
          Loading contact content…
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-[16px] border border-line glass-panel p-6">
      <h2 className="mb-5 font-medium text-ink">Contact section</h2>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left column — hero copy */}
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
            <textarea
              rows={2}
              value={values[HEADING_FIELD.key]}
              onChange={(e) => handleChange(HEADING_FIELD.key, e.target.value)}
              placeholder={"Got a question?\nWe're listening."}
              className="mt-2 w-full resize-y rounded-sm border border-line bg-canvas-alt/60 px-4 py-3 text-ink outline-none transition focus:border-primary focus:bg-canvas focus:ring-4 focus:ring-primary/10"
            />
            <p className="mt-1 text-[12px] text-ink-soft">Start a new line to control where the heading wraps.</p>
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
          </div>
        </div>

        {/* Right column — the actual contact details */}
        <div className="space-y-5">
          <StringListEditor
            label="Phone numbers"
            items={phones}
            onChange={handlePhonesChange}
            placeholder="0916 530 7582"
          />
          <p className="-mt-3 text-[12px] text-ink-soft">
            Enter local Nigerian numbers (e.g. 0916 530 7582) — the "tel:" link is generated automatically.
          </p>

          <div>
            <label className="block text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
              {EMAIL_FIELD.label}
            </label>
            <input
              type="email"
              value={values[EMAIL_FIELD.key]}
              onChange={(e) => handleChange(EMAIL_FIELD.key, e.target.value)}
              className="mt-2 w-full rounded-sm border border-line bg-canvas-alt/60 px-4 py-3 text-ink outline-none transition focus:border-primary focus:bg-canvas focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
              {ADDRESS_FIELD.label}
            </label>
            <input
              type="text"
              value={values[ADDRESS_FIELD.key]}
              onChange={(e) => handleChange(ADDRESS_FIELD.key, e.target.value)}
              className="mt-2 w-full rounded-sm border border-line bg-canvas-alt/60 px-4 py-3 text-ink outline-none transition focus:border-primary focus:bg-canvas focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
              {MAP_QUERY_FIELD.label}
            </label>
            <input
              type="text"
              value={values[MAP_QUERY_FIELD.key]}
              onChange={(e) => handleChange(MAP_QUERY_FIELD.key, e.target.value)}
              className="mt-2 w-full rounded-sm border border-line bg-canvas-alt/60 px-4 py-3 text-ink outline-none transition focus:border-primary focus:bg-canvas focus:ring-4 focus:ring-primary/10"
            />
            <p className="mt-1 text-[12px] text-ink-soft">
              Drives both the "Visit the farm" link and the embedded map — use a Google Maps search
              string with spaces as "+", e.g. Talawan+Global+Farms+Ibadan+Oyo+State.
            </p>
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
            Contact section updated.
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
