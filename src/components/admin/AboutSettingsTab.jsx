import { useEffect, useState } from 'react'
import { Loader2, AlertCircle, CheckCircle2, UploadCloud, Link2 } from 'lucide-react'
import { fetchSectionContent, upsertSectionContent, uploadContentImage } from '../../lib/siteContent'

const SECTION = 'about'

const SUPABASE_STORAGE_URL =
  'https://bhcyamtmorvzfckmlhfq.supabase.co/storage/v1/object/public/farm-images/'

const ABOUT_DEFAULTS = {
  'about.eyebrow': 'About Talawan',
  'about.heading': "Decades in the making.\nBuilt for what's next.",
  'about.paragraph':
    "Talawan has worked this land for decades, passing through different hands along the way. What's stayed constant is the mix — livestock and oil palm, side by side, never just one or the other. What's changing now is how we run it: bringing in the tools and systems to take that same foundation further, faster, and further afield.",
  'about.founding_year': '1989',
  'about.stat1_label': 'Years farming',
  'about.stat2_value': '2M+',
  'about.stat2_label': 'Birds raised yearly',
  'about.stat3_value': '4',
  'about.stat3_label': 'Farm divisions',
  'about.collage_1_url': `${SUPABASE_STORAGE_URL}farm-oilpalm-tree.jpg`,
  'about.collage_1_alt': 'Oil palm growing on the Talawan plantation',
  'about.collage_2_url': `${SUPABASE_STORAGE_URL}farm-poultry-layers.jpg`,
  'about.collage_2_alt': 'Layer hens inside a Talawan poultry house',
  'about.collage_3_url': `${SUPABASE_STORAGE_URL}farm-ducks.jpg`,
  'about.collage_3_alt': 'Ducks and geese at the Talawan pond',
  'about.collage_4_url': `${SUPABASE_STORAGE_URL}farm-oilpalm-fruit.jpg`,
  'about.collage_4_alt': 'Freshly harvested oil palm fruit bunches at Talawan',
  'about.seal_top_text': 'TALAWAN GLOBAL FARMS',
  'about.seal_bottom_text': 'FEEDING THE NATION',
  'about.seal_since_label': 'SINCE',
}

const EYEBROW_FIELD = { key: 'about.eyebrow', label: 'Eyebrow label' }

const TEXTAREA_FIELDS = [
  { key: 'about.heading', label: 'Heading (one line per row)', rows: 2 },
  { key: 'about.paragraph', label: 'Paragraph', rows: 5 },
]

const FOUNDING_YEAR_FIELD = { key: 'about.founding_year', label: 'Founding year' }
const STAT1_LABEL_FIELD = { key: 'about.stat1_label', label: 'Stat 1 label' }

const STAT_FIELDS = [
  { key: 'about.stat2_value', label: 'Stat 2 value' },
  { key: 'about.stat2_label', label: 'Stat 2 label' },
  { key: 'about.stat3_value', label: 'Stat 3 value' },
  { key: 'about.stat3_label', label: 'Stat 3 label' },
]

const SEAL_FIELDS = [
  { key: 'about.seal_top_text', label: 'Seal — top arc text' },
  { key: 'about.seal_bottom_text', label: 'Seal — bottom arc text' },
  { key: 'about.seal_since_label', label: 'Seal — "since" label' },
]

const COLLAGE_FIELDS = [
  { key: 'about.collage_1_url', altKey: 'about.collage_1_alt', label: 'Collage image 1' },
  { key: 'about.collage_2_url', altKey: 'about.collage_2_alt', label: 'Collage image 2' },
  { key: 'about.collage_3_url', altKey: 'about.collage_3_alt', label: 'Collage image 3' },
  { key: 'about.collage_4_url', altKey: 'about.collage_4_alt', label: 'Collage image 4' },
]

function ImageField({ field, value, altValue, onChange, onAltChange }) {
  const [uploading, setUploading] = useState(false)
  const [mode, setMode] = useState('upload') // 'upload' | 'url'

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadContentImage(file, field.key)
      onChange(field.key, url)
    } catch (err) {
      console.error(`[AboutSettingsTab] upload failed for ${field.key}:`, err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="block text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
          {field.label}
        </label>
        <div className="flex overflow-hidden rounded-full border border-line text-[11px]">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`flex items-center gap-1 px-3 py-1 ${mode === 'upload' ? 'bg-ink text-canvas' : 'text-ink-soft'}`}
          >
            <UploadCloud className="h-3 w-3" /> Upload
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`flex items-center gap-1 px-3 py-1 ${mode === 'url' ? 'bg-ink text-canvas' : 'text-ink-soft'}`}
          >
            <Link2 className="h-3 w-3" /> URL
          </button>
        </div>
      </div>

      {value && (
        <img
          src={value}
          alt=""
          className="mb-3 aspect-square w-full max-w-[240px] rounded-[14px] border border-line object-cover"
        />
      )}

      {mode === 'upload' ? (
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            disabled={uploading}
            className="block w-full text-[13px] text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-canvas-alt file:px-4 file:py-2 file:text-[12px] file:font-medium file:uppercase file:tracking-[0.08em] file:text-ink hover:file:bg-line/60"
          />
          {uploading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />}
        </div>
      ) : (
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder="https://..."
          className="w-full rounded-sm border border-line bg-canvas-alt/60 px-4 py-2.5 text-ink outline-none transition focus:border-primary focus:bg-canvas focus:ring-4 focus:ring-primary/10"
        />
      )}

      <input
        type="text"
        value={altValue}
        onChange={(e) => onAltChange(field.altKey, e.target.value)}
        placeholder="Describe this photo (for accessibility)"
        className="mt-2 w-full rounded-sm border border-line bg-canvas-alt/60 px-4 py-2 text-[13px] text-ink outline-none transition focus:border-primary focus:bg-canvas focus:ring-4 focus:ring-primary/10"
      />
    </div>
  )
}

export default function AboutSettingsTab() {
  const [values, setValues] = useState(ABOUT_DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('idle') // idle | saving | success | error
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchSectionContent(SECTION, ABOUT_DEFAULTS).then((data) => {
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
      const textEntries = [
        EYEBROW_FIELD,
        ...TEXTAREA_FIELDS,
        FOUNDING_YEAR_FIELD,
        STAT1_LABEL_FIELD,
        ...STAT_FIELDS,
        ...SEAL_FIELDS,
        ...COLLAGE_FIELDS.map(({ altKey }) => ({ key: altKey })),
      ].map(({ key }) => ({
        key,
        value: values[key],
        type: 'text',
      }))
      const imageEntries = COLLAGE_FIELDS.map(({ key }) => ({ key, value: values[key], type: 'image' }))
      await upsertSectionContent([...textEntries, ...imageEntries], SECTION)
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
        Loading about content…
      </div>
    )
  }

  return (
    <div className="rounded-[16px] border border-line glass-panel p-6">
      <h2 className="mb-5 font-medium text-ink">About section</h2>

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

          {TEXTAREA_FIELDS.map((field) => (
            <div key={field.key}>
              <label className="block text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
                {field.label}
              </label>
              <textarea
                rows={field.rows}
                value={values[field.key]}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="mt-2 w-full rounded-sm border border-line bg-canvas-alt/60 px-4 py-3 text-ink outline-none transition focus:border-primary focus:bg-canvas focus:ring-4 focus:ring-primary/10"
              />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
                {FOUNDING_YEAR_FIELD.label}
              </label>
              <input
                type="text"
                value={values[FOUNDING_YEAR_FIELD.key]}
                onChange={(e) => handleChange(FOUNDING_YEAR_FIELD.key, e.target.value)}
                className="mt-2 w-full rounded-sm border border-line bg-canvas-alt/60 px-4 py-3 text-ink outline-none transition focus:border-primary focus:bg-canvas focus:ring-4 focus:ring-primary/10"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
                {STAT1_LABEL_FIELD.label}
              </label>
              <input
                type="text"
                value={values[STAT1_LABEL_FIELD.key]}
                onChange={(e) => handleChange(STAT1_LABEL_FIELD.key, e.target.value)}
                className="mt-2 w-full rounded-sm border border-line bg-canvas-alt/60 px-4 py-3 text-ink outline-none transition focus:border-primary focus:bg-canvas focus:ring-4 focus:ring-primary/10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {STAT_FIELDS.map((field) => (
              <div key={field.key}>
                <label className="block text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
                  {field.label}
                </label>
                <input
                  type="text"
                  value={values[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="mt-2 w-full rounded-sm border border-line bg-canvas-alt/60 px-4 py-3 text-ink outline-none transition focus:border-primary focus:bg-canvas focus:ring-4 focus:ring-primary/10"
                />
              </div>
            ))}
          </div>

          <div>
            <p className="block text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
              Heritage seal text
            </p>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SEAL_FIELDS.map((field) => (
                <div key={field.key}>
                  <label className="block text-[11px] text-ink-soft">{field.label}</label>
                  <input
                    type="text"
                    value={values[field.key]}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="mt-1 w-full rounded-sm border border-line bg-canvas-alt/60 px-4 py-2.5 text-ink outline-none transition focus:border-primary focus:bg-canvas focus:ring-4 focus:ring-primary/10"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column — collage images */}
        <div className="space-y-5">
          <p className="block text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">Collage images</p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {COLLAGE_FIELDS.map((field) => (
              <ImageField
                key={field.key}
                field={field}
                value={values[field.key]}
                altValue={values[field.altKey]}
                onChange={handleChange}
                onAltChange={handleChange}
              />
            ))}
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
            About section updated.
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
