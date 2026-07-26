import { useEffect, useState } from 'react'
import { Loader2, AlertCircle, CheckCircle2, UploadCloud, Link2 } from 'lucide-react'
import { fetchSectionContent, upsertSectionContent, uploadContentImage } from '../../lib/siteContent'
import logoIcon from '../../assets/logo-icon-color.png'
import logoWordmark from '../../assets/logo-wordmark-color.png'

const SECTION = 'hero'

const HERO_DEFAULTS = {
  'hero.heading': 'The Next Generation of Farming is Here',
  'hero.cta_label': 'Get in Touch',
  'hero.video_url': '/videos/hero-farm.mp4',
  'hero.poster_url': '/videos/hero-poster.jpg',
  'hero.logo_icon_url': logoIcon,
  'hero.logo_wordmark_url': logoWordmark,
}

// Which fields are plain text vs. media (image/video), and what type
// each media field should be tagged as when saved to site_content.
const TEXT_FIELDS = [
  { key: 'hero.heading', label: 'Hero heading' },
  { key: 'hero.cta_label', label: '"Get in Touch" button label' },
]

const MEDIA_FIELDS = [
  { key: 'hero.logo_icon_url', label: 'Logo icon', type: 'image', accept: 'image/*' },
  { key: 'hero.logo_wordmark_url', label: 'Logo wordmark', type: 'image', accept: 'image/*' },
  { key: 'hero.video_url', label: 'Background video', type: 'video', accept: 'video/*' },
  { key: 'hero.poster_url', label: 'Video poster image', type: 'image', accept: 'image/*' },
]

function MediaField({ field, value, onChange }) {
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
      console.error(`[HeroSettingsTab] upload failed for ${field.key}:`, err.message)
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

      {field.type === 'image' && value && (
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
            accept={field.accept}
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
    </div>
  )
}

export default function HeroSettingsTab() {
  const [values, setValues] = useState(HERO_DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('idle') // idle | saving | success | error
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchSectionContent(SECTION, HERO_DEFAULTS).then((data) => {
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
      const textEntries = TEXT_FIELDS.map(({ key }) => ({ key, value: values[key], type: 'text' }))
      const mediaEntries = MEDIA_FIELDS.map(({ key, type }) => ({ key, value: values[key], type }))
      await upsertSectionContent([...textEntries, ...mediaEntries], SECTION)
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
        Loading hero content…
      </div>
    )
  }

  return (
    <div className="rounded-[16px] border border-line glass-panel p-6">
      <h2 className="mb-5 font-medium text-ink">Hero section</h2>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left column — copy */}
        <div className="space-y-5">
          {TEXT_FIELDS.map((field) => (
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

        {/* Right column — video/images */}
        <div className="space-y-5">
          <p className="block text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">Media</p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {MEDIA_FIELDS.map((field) => (
              <MediaField key={field.key} field={field} value={values[field.key]} onChange={handleChange} />
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
            Hero section updated.
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
