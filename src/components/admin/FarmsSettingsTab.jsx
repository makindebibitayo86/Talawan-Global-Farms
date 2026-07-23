import { useEffect, useState } from 'react'
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  ImagePlus,
  X,
  Egg,
  Bird,
  TreePalm,
  Waves,
  Sprout,
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

// Icon choices offered to the admin — keep this list's keys in sync with the
// ICONS map in OurFarms.jsx, since icon_key is what actually gets rendered
// on the public site.
const ICON_OPTIONS = [
  { key: 'egg', label: 'Egg', Icon: Egg },
  { key: 'bird', label: 'Bird', Icon: Bird },
  { key: 'tree-palm', label: 'Tree Palm', Icon: TreePalm },
  { key: 'waves', label: 'Waves', Icon: Waves },
  { key: 'sprout', label: 'Sprout', Icon: Sprout },
]
const ICON_MAP = Object.fromEntries(ICON_OPTIONS.map((o) => [o.key, o.Icon]))

function safeParseArray(value) {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function slugify(name, existingSlugs) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'farm'
  let slug = base
  let i = 2
  while (existingSlugs.includes(slug)) {
    slug = `${base}${i}`
    i += 1
  }
  return slug
}

function rowsFromFarms(farms) {
  // Flattens the farms array back into site_content rows, mirroring the
  // key-value convention buildFarmsFromRows() reads on the public site:
  // farms.order + farms.<slug>.<field> per farm.
  const rows = [
    {
      key: 'farms.order',
      value: JSON.stringify(farms.map((f) => f.slug)),
      type: 'text',
      section: 'farms',
    },
  ]
  for (const farm of farms) {
    const p = `farms.${farm.slug}`
    rows.push(
      { key: `${p}.name`, value: farm.name, type: 'text', section: 'farms' },
      { key: `${p}.icon_key`, value: farm.icon_key, type: 'text', section: 'farms' },
      { key: `${p}.tagline`, value: farm.tagline, type: 'text', section: 'farms' },
      { key: `${p}.detail`, value: farm.detail, type: 'text', section: 'farms' },
      { key: `${p}.process`, value: JSON.stringify(farm.process), type: 'text', section: 'farms' },
      { key: `${p}.products`, value: JSON.stringify(farm.products), type: 'text', section: 'farms' },
      { key: `${p}.images`, value: JSON.stringify(farm.images), type: 'text', section: 'farms' },
      { key: `${p}.video_url`, value: farm.video_url || null, type: 'video', section: 'farms' }
    )
  }
  return rows
}

function emptyFarm(slug) {
  return {
    slug,
    name: 'New Farm',
    icon_key: 'egg',
    tagline: '',
    detail: '',
    process: [],
    products: [],
    images: [],
    video_url: '',
  }
}

// A single line-item text list (used for both "process" and "products")
// with inline add/remove — no separate modal, just grows in place.
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
              className="shrink-0 rounded-full p-1.5 text-ink-soft transition-colors hover:bg-red-50 hover:text-red-600"
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
        Add item
      </button>
    </div>
  )
}

function ImagesEditor({ slug, images, onChange }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFiles(fileList) {
    setError('')
    const files = Array.from(fileList || [])
    if (files.length === 0) return

    setUploading(true)
    const uploaded = []
    for (const file of files) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
      const path = `${slug}-${Date.now()}-${safeName}`
      const { error: uploadError } = await supabase.storage
        .from('farm-images')
        .upload(path, file, { upsert: false })

      if (uploadError) {
        setError(uploadError.message)
        continue
      }
      const { data: publicUrlData } = supabase.storage.from('farm-images').getPublicUrl(path)
      uploaded.push(publicUrlData.publicUrl)
    }
    setUploading(false)
    if (uploaded.length > 0) onChange([...images, ...uploaded])
  }

  function removeAt(idx) {
    onChange(images.filter((_, i) => i !== idx))
  }

  return (
    <div>
      <span className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
        Photos
      </span>
      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {images.map((src, idx) => (
          <div key={src} className="group relative aspect-square overflow-hidden rounded-[10px] border border-line">
            <img src={src} alt={`Farm photo ${idx + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(idx)}
              aria-label="Remove photo"
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-canvas opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
          </div>
        ))}
        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-[10px] border border-dashed border-ink/20 text-ink-soft transition-colors hover:border-primary hover:text-primary">
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
          ) : (
            <ImagePlus className="h-4 w-4" strokeWidth={1.75} />
          )}
          <span className="text-[10px] font-medium uppercase tracking-[0.06em]">
            {uploading ? 'Uploading' : 'Add photo'}
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      </div>
      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          {error}
        </p>
      )}
      {images.length === 0 && !uploading && (
        <p className="mt-2 text-[12px] text-ink-soft">
          At least one photo is recommended — the first photo becomes the cover image.
        </p>
      )}
    </div>
  )
}

function FarmCard({ farm, isOpen, onToggle, onChange, onDelete, onMove, isFirst, isLast }) {
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function set(field, value) {
    onChange({ ...farm, [field]: value })
  }

  async function handleSave() {
    setStatus('submitting')
    setErrorMsg('')

    if (!farm.name.trim()) {
      setStatus('error')
      setErrorMsg('Give this farm a name before saving.')
      return
    }

    const rows = rowsFromFarms([farm]).filter((r) => r.key !== 'farms.order')
    const { error } = await supabase.from('site_content').upsert(rows, { onConflict: 'key' })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
      return
    }
    setStatus('success')
    setTimeout(() => setStatus('idle'), 2000)
  }

  const Icon = ICON_MAP[farm.icon_key] || Egg

  return (
    <div className="rounded-[16px] border border-line bg-canvas">
      <div className="flex items-center gap-3 px-5 py-4">
        <button
          type="button"
          onClick={onToggle}
          className="flex flex-1 items-center gap-3 text-left"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="h-4 w-4" strokeWidth={2} />
          </span>
          <span>
            <span className="block font-medium text-ink">{farm.name || 'Untitled farm'}</span>
            <span className="block text-[12px] text-ink-soft">{farm.tagline || 'No tagline yet'}</span>
          </span>
          <ChevronRight
            className={`ml-auto h-4 w-4 shrink-0 text-ink-soft transition-transform ${isOpen ? 'rotate-90' : ''}`}
            strokeWidth={2}
          />
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={isFirst}
            aria-label="Move up"
            className="rounded-full p-1.5 text-ink-soft transition-colors hover:bg-canvas-alt hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronUp className="h-4 w-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={isLast}
            aria-label="Move down"
            className="rounded-full p-1.5 text-ink-soft transition-colors hover:bg-canvas-alt hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronDown className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="space-y-5 border-t border-line px-5 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
                Name
              </label>
              <input
                value={farm.name}
                onChange={(e) => set('name', e.target.value)}
                className="mt-2 w-full rounded-sm border border-line bg-canvas-alt/60 px-4 py-3 text-ink outline-none transition focus:border-primary focus:bg-canvas focus:ring-4 focus:ring-primary/10"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
                Tagline
              </label>
              <input
                value={farm.tagline}
                onChange={(e) => set('tagline', e.target.value)}
                className="mt-2 w-full rounded-sm border border-line bg-canvas-alt/60 px-4 py-3 text-ink outline-none transition focus:border-primary focus:bg-canvas focus:ring-4 focus:ring-primary/10"
              />
            </div>
          </div>

          <div>
            <span className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">Icon</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {ICON_OPTIONS.map(({ key, label, Icon: OptIcon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => set('icon_key', key)}
                  aria-label={label}
                  aria-pressed={farm.icon_key === key}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                    farm.icon_key === key
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-line text-ink-soft hover:text-ink'
                  }`}
                >
                  <OptIcon className="h-4 w-4" strokeWidth={2} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
              Detail / write-up
            </label>
            <textarea
              value={farm.detail}
              onChange={(e) => set('detail', e.target.value)}
              rows={4}
              className="mt-2 w-full resize-y rounded-sm border border-line bg-canvas-alt/60 px-4 py-3 text-ink outline-none transition focus:border-primary focus:bg-canvas focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <StringListEditor
            label="What we do"
            items={farm.process}
            onChange={(v) => set('process', v)}
            placeholder="e.g. Daily feed & flock health monitoring"
          />

          <StringListEditor
            label="What we produce"
            items={farm.products}
            onChange={(v) => set('products', v)}
            placeholder="e.g. Fresh eggs"
          />

          <ImagesEditor slug={farm.slug} images={farm.images} onChange={(v) => set('images', v)} />

          <div>
            <label className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
              Video URL (optional)
            </label>
            <input
              value={farm.video_url || ''}
              onChange={(e) => set('video_url', e.target.value)}
              placeholder="/videos/farm-name.mp4"
              className="mt-2 w-full rounded-sm border border-line bg-canvas-alt/60 px-4 py-3 text-ink outline-none transition focus:border-primary focus:bg-canvas focus:ring-4 focus:ring-primary/10"
            />
          </div>

          {status === 'error' && (
            <p className="flex items-center gap-2 text-sm font-medium text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              {errorMsg}
            </p>
          )}
          {status === 'success' && (
            <p className="flex items-center gap-2 text-sm font-medium text-primary">
              <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              Saved.
            </p>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
            {confirmingDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-ink">Delete this farm?</span>
                <button
                  type="button"
                  onClick={onDelete}
                  className="rounded-full bg-red-600 px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-red-700"
                >
                  Yes, delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="rounded-full px-3 py-1.5 text-[12px] font-medium text-ink-soft transition-colors hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="flex items-center gap-1.5 text-[12px] font-medium text-ink-soft transition-colors hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                Delete farm
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={status === 'submitting'}
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13px] font-medium uppercase tracking-[0.08em] text-canvas transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === 'submitting' && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
              {status === 'submitting' ? 'Saving' : 'Save farm'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function HeaderEditor({ header, onChange }) {
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState('')

  function set(field, value) {
    onChange({ ...header, [field]: value })
  }

  async function handleSave() {
    setStatus('submitting')
    setErrorMsg('')

    const rows = [
      { key: 'farms.section_label', value: header.label, type: 'text', section: 'farms' },
      { key: 'farms.heading', value: header.heading, type: 'text', section: 'farms' },
      { key: 'farms.intro', value: header.intro, type: 'text', section: 'farms' },
    ]
    const { error } = await supabase.from('site_content').upsert(rows, { onConflict: 'key' })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
      return
    }
    setStatus('success')
    setTimeout(() => setStatus('idle'), 2000)
  }

  return (
    <div className="space-y-4 rounded-[16px] border border-line bg-canvas p-5">
      <div>
        <label className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
          Eyebrow label
        </label>
        <input
          value={header.label}
          onChange={(e) => set('label', e.target.value)}
          className="mt-2 w-full rounded-sm border border-line bg-canvas-alt/60 px-4 py-3 text-ink outline-none transition focus:border-primary focus:bg-canvas focus:ring-4 focus:ring-primary/10"
        />
      </div>

      <div>
        <label className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
          Heading
        </label>
        <textarea
          value={header.heading}
          onChange={(e) => set('heading', e.target.value)}
          rows={2}
          placeholder={'Four farms.\nOne family standard.'}
          className="mt-2 w-full resize-y rounded-sm border border-line bg-canvas-alt/60 px-4 py-3 text-ink outline-none transition focus:border-primary focus:bg-canvas focus:ring-4 focus:ring-primary/10"
        />
        <p className="mt-1 text-[12px] text-ink-soft">Start a new line to control where the heading wraps.</p>
      </div>

      <div>
        <label className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
          Intro paragraph
        </label>
        <textarea
          value={header.intro}
          onChange={(e) => set('intro', e.target.value)}
          rows={3}
          className="mt-2 w-full resize-y rounded-sm border border-line bg-canvas-alt/60 px-4 py-3 text-ink outline-none transition focus:border-primary focus:bg-canvas focus:ring-4 focus:ring-primary/10"
        />
      </div>

      {status === 'error' && (
        <p className="flex items-center gap-2 text-sm font-medium text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          {errorMsg}
        </p>
      )}
      {status === 'success' && (
        <p className="flex items-center gap-2 text-sm font-medium text-primary">
          <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          Saved.
        </p>
      )}

      <div className="flex justify-end border-t border-line pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={status === 'submitting'}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13px] font-medium uppercase tracking-[0.08em] text-canvas transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === 'submitting' && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
          {status === 'submitting' ? 'Saving' : 'Save header'}
        </button>
      </div>
    </div>
  )
}

export default function FarmsSettingsTab() {
  const [farms, setFarms] = useState([])
  const [header, setHeader] = useState({ label: '', heading: '', intro: '' })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [openSlug, setOpenSlug] = useState(null)
  const [orderStatus, setOrderStatus] = useState('idle') // idle | saving | error

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('site_content')
        .select('key, value')
        .eq('section', 'farms')

      if (error) {
        setLoadError(error.message)
        setLoading(false)
        return
      }

      const byKey = {}
      for (const row of data) byKey[row.key] = row.value
      const order = safeParseArray(byKey['farms.order'])

      const loaded = order.map((slug) => {
        const get = (field) => byKey[`farms.${slug}.${field}`]
        return {
          slug,
          name: get('name') || '',
          icon_key: get('icon_key') || 'egg',
          tagline: get('tagline') || '',
          detail: get('detail') || '',
          process: safeParseArray(get('process')),
          products: safeParseArray(get('products')),
          images: safeParseArray(get('images')),
          video_url: get('video_url') || '',
        }
      })

      setFarms(loaded)
      setHeader({
        label: byKey['farms.section_label'] || '',
        heading: byKey['farms.heading'] || '',
        intro: byKey['farms.intro'] || '',
      })
      setLoading(false)
    }
    load()
  }, [])

  async function persistOrder(nextFarms) {
    setOrderStatus('saving')
    const { error } = await supabase
      .from('site_content')
      .upsert(
        { key: 'farms.order', value: JSON.stringify(nextFarms.map((f) => f.slug)), type: 'text', section: 'farms' },
        { onConflict: 'key' }
      )
    setOrderStatus(error ? 'error' : 'idle')
  }

  function updateFarm(slug, nextFarm) {
    setFarms((prev) => prev.map((f) => (f.slug === slug ? nextFarm : f)))
  }

  function moveFarm(slug, direction) {
    setFarms((prev) => {
      const idx = prev.findIndex((f) => f.slug === slug)
      const swapWith = idx + direction
      if (swapWith < 0 || swapWith >= prev.length) return prev
      const next = [...prev]
      ;[next[idx], next[swapWith]] = [next[swapWith], next[idx]]
      persistOrder(next)
      return next
    })
  }

  async function addFarm() {
    const slug = slugify('new farm', farms.map((f) => f.slug))
    const next = [...farms, emptyFarm(slug)]
    setFarms(next)
    setOpenSlug(slug)
    await persistOrder(next)
  }

  async function deleteFarm(slug) {
    const next = farms.filter((f) => f.slug !== slug)
    setFarms(next)
    if (openSlug === slug) setOpenSlug(null)

    await supabase.from('site_content').delete().like('key', `farms.${slug}.%`)
    await persistOrder(next)
  }

  if (loading) {
    return (
      <div className="rounded-[16px] border border-line bg-canvas p-6">
        <div className="flex items-center gap-2 text-ink-soft">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
          Loading farms…
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="rounded-[16px] border border-line bg-canvas p-6">
        <p className="flex items-center gap-2 text-sm font-medium text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          Couldn't load farms: {loadError}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-[16px] border border-line bg-canvas p-6">
      <h2 className="mb-5 font-medium text-ink">Farms section</h2>

      <div className="w-full space-y-4">
        {orderStatus === 'error' && (
          <span className="flex items-center gap-1.5 text-[12px] font-medium text-red-600">
            <AlertCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
            Order didn't save
          </span>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <HeaderEditor header={header} onChange={setHeader} />
          </div>

          <div className="space-y-3">
            {farms.map((farm, idx) => (
              <FarmCard
                key={farm.slug}
                farm={farm}
                isOpen={openSlug === farm.slug}
                onToggle={() => setOpenSlug(openSlug === farm.slug ? null : farm.slug)}
                onChange={(next) => updateFarm(farm.slug, next)}
                onDelete={() => deleteFarm(farm.slug)}
                onMove={(direction) => moveFarm(farm.slug, direction)}
                isFirst={idx === 0}
                isLast={idx === farms.length - 1}
              />
            ))}

            {farms.length === 0 && (
              <p className="rounded-[16px] border border-dashed border-ink/15 px-5 py-8 text-center text-[13px] text-ink-soft">
                No farms yet. Add your first one below.
              </p>
            )}

            <button
              type="button"
              onClick={addFarm}
              className="flex w-full items-center justify-center gap-2 rounded-[16px] border border-dashed border-ink/20 py-4 text-[13px] font-medium uppercase tracking-[0.06em] text-ink-soft transition-colors hover:border-primary hover:text-primary"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Add farm
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
