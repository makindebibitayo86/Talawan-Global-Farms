import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Plus, Pencil, Trash2, X, Loader2, AlertCircle, Upload, GripVertical, RefreshCw,
  Egg, Bird, TreePalm, Waves,
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

const BUCKET = 'farm-images'
const SUPABASE_STORAGE_URL =
  'https://bhcyamtmorvzfckmlhfq.supabase.co/storage/v1/object/public/farm-images/'
const img = (filename) => (filename ? `${SUPABASE_STORAGE_URL}${filename}` : null)

const ICON_OPTIONS = ['egg', 'bird', 'tree-palm', 'waves']
const ICON_MAP = { egg: Egg, bird: Bird, 'tree-palm': TreePalm, waves: Waves }

const EMPTY_PRODUCT = {
  name: '',
  category: '',
  icon_key: 'egg',
  tagline: '',
  description: '',
  details: [],
  specs: [],
  image_filename: '',
  sort_order: 0,
}

function slugifyFilename(file) {
  const stamp = Date.now()
  const clean = file.name.trim().toLowerCase().replace(/[^a-z0-9.]+/g, '-')
  return `${stamp}-${clean}`
}

function ProductForm({ initial, onClose, onSaved }) {
  const isEdit = Boolean(initial?.id)
  const [form, setForm] = useState({ ...EMPTY_PRODUCT, ...initial })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function updateDetail(i, value) {
    setForm((prev) => ({
      ...prev,
      details: prev.details.map((d, idx) => (idx === i ? value : d)),
    }))
  }
  function addDetail() {
    setForm((prev) => ({ ...prev, details: [...prev.details, ''] }))
  }
  function removeDetail(i) {
    setForm((prev) => ({ ...prev, details: prev.details.filter((_, idx) => idx !== i) }))
  }

  function updateSpec(i, field, value) {
    setForm((prev) => ({
      ...prev,
      specs: prev.specs.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)),
    }))
  }
  function addSpec() {
    setForm((prev) => ({ ...prev, specs: [...prev.specs, { label: '', value: '' }] }))
  }
  function removeSpec(i) {
    setForm((prev) => ({ ...prev, specs: prev.specs.filter((_, idx) => idx !== i) }))
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')

    const filename = slugifyFilename(file)
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filename, file, { upsert: true })

    setUploading(false)
    if (uploadError) {
      setError(`Image upload failed: ${uploadError.message}`)
      return
    }
    set('image_filename', filename)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      name: form.name,
      category: form.category,
      icon_key: form.icon_key,
      tagline: form.tagline,
      description: form.description,
      details: form.details.filter((d) => d.trim() !== ''),
      specs: form.specs.filter((s) => s.label.trim() !== '' || s.value.trim() !== ''),
      image_filename: form.image_filename,
      sort_order: Number(form.sort_order) || 0,
    }

    const query = isEdit
      ? supabase.from('products').update(payload).eq('id', form.id)
      : supabase.from('products').insert(payload)

    const { error: saveError } = await query
    setSaving(false)

    if (saveError) {
      setError(saveError.message)
      return
    }
    onSaved()
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-3 backdrop-blur-sm md:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[24px] bg-canvas shadow-2xl"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-display text-xl font-semibold text-ink">
            {isEdit ? 'Edit product' : 'Add product'}
          </h2>
          <button onClick={onClose} aria-label="Close" className="text-ink-soft hover:text-primary">
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className="mt-1.5 w-full rounded-sm border border-line bg-canvas px-3 py-2.5 text-ink outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">Category</label>
              <input
                required
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className="mt-1.5 w-full rounded-sm border border-line bg-canvas px-3 py-2.5 text-ink outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">Icon</label>
              <div className="mt-1.5 flex items-center gap-2">
                {ICON_OPTIONS.map((opt) => {
                  const IconComp = ICON_MAP[opt]
                  const selected = form.icon_key === opt
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => set('icon_key', opt)}
                      aria-label={opt}
                      aria-pressed={selected}
                      className={`flex h-11 w-11 items-center justify-center rounded-sm border transition-colors ${
                        selected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-line text-ink-soft hover:border-primary/50 hover:text-primary'
                      }`}
                    >
                      <IconComp className="h-5 w-5" strokeWidth={1.75} />
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">Sort order</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => set('sort_order', e.target.value)}
                className="mt-1.5 w-full rounded-sm border border-line bg-canvas px-3 py-2.5 text-ink outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </div>

            <div className="col-span-2">
              <label className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">Tagline</label>
              <input
                value={form.tagline}
                onChange={(e) => set('tagline', e.target.value)}
                className="mt-1.5 w-full rounded-sm border border-line bg-canvas px-3 py-2.5 text-ink outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </div>

            <div className="col-span-2">
              <label className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                className="mt-1.5 w-full resize-none rounded-sm border border-line bg-canvas px-3 py-2.5 text-ink outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </div>

            {/* Image */}
            <div className="col-span-2">
              <label className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">Photo</label>
              <div className="mt-1.5 flex items-center gap-4">
                {form.image_filename ? (
                  <img
                    src={img(form.image_filename)}
                    alt=""
                    className="h-44 w-44 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-44 w-44 items-center justify-center rounded-md bg-ink/5 text-ink-soft">
                    <Upload className="h-10 w-10" strokeWidth={1.75} />
                  </div>
                )}
                <label className="cursor-pointer rounded-full border border-line px-4 py-2 text-[12px] font-medium uppercase tracking-[0.08em] text-ink transition-colors hover:border-primary hover:text-primary">
                  {uploading ? 'Uploading…' : 'Upload image'}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                </label>
              </div>
            </div>

            {/* Details list */}
            <div className="col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">Product details</label>
                <button type="button" onClick={addDetail} className="text-[12px] font-semibold text-primary">
                  + Add line
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {form.details.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 shrink-0 text-ink-soft/50" strokeWidth={1.75} />
                    <input
                      value={d}
                      onChange={(e) => updateDetail(i, e.target.value)}
                      className="w-full rounded-sm border border-line bg-canvas px-3 py-2 text-[14px] text-ink outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />
                    <button type="button" onClick={() => removeDetail(i)} aria-label="Remove" className="text-ink-soft hover:text-red-600">
                      <X className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Specs list */}
            <div className="col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">Specs (at a glance)</label>
                <button type="button" onClick={addSpec} className="text-[12px] font-semibold text-primary">
                  + Add spec
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {form.specs.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      placeholder="Label"
                      value={s.label}
                      onChange={(e) => updateSpec(i, 'label', e.target.value)}
                      className="w-1/2 rounded-sm border border-line bg-canvas px-3 py-2 text-[14px] text-ink outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />
                    <input
                      placeholder="Value"
                      value={s.value}
                      onChange={(e) => updateSpec(i, 'value', e.target.value)}
                      className="w-1/2 rounded-sm border border-line bg-canvas px-3 py-2 text-[14px] text-ink outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />
                    <button type="button" onClick={() => removeSpec(i)} aria-label="Remove" className="text-ink-soft hover:text-red-600">
                      <X className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <p className="mt-4 flex items-center gap-2 text-sm font-medium text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              {error}
            </p>
          )}
        </form>

        <div className="flex items-center justify-end gap-3 border-t border-line px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-5 py-2.5 text-[13px] font-medium uppercase tracking-[0.08em] text-ink-soft hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || uploading}
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-[13px] font-medium uppercase tracking-[0.08em] text-canvas transition-colors hover:bg-primary-dark disabled:opacity-70"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
            {isEdit ? 'Save changes' : 'Add product'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function AdminProducts() {
  const PAGE_SIZE = 10
  const [products, setProducts] = useState([])
  const [status, setStatus] = useState('loading')
  const [editing, setEditing] = useState(null) // null = closed, {} = new, {...} = edit
  const [deletingId, setDeletingId] = useState(null)
  const [page, setPage] = useState(1)

  async function load() {
    setStatus('loading')
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error(error)
      setStatus('error')
      return
    }
    setProducts(data ?? [])
    setStatus('ready')
    setPage(1)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleDelete(product) {
    if (!window.confirm(`Delete "${product.name}"? This can't be undone.`)) return
    setDeletingId(product.id)
    const { error } = await supabase.from('products').delete().eq('id', product.id)
    setDeletingId(null)
    if (error) {
      alert(`Couldn't delete: ${error.message}`)
      return
    }
    load()
  }

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE))
  const paginatedProducts = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-px w-6 bg-primary" />
            <span className="text-[12px] font-medium uppercase tracking-[0.18em] text-primary">Our Products</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-ink">What comes off the farm.</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={load}
            disabled={status === 'loading'}
            aria-label="Refresh"
            className="flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-[13px] font-medium uppercase tracking-[0.08em] text-ink-soft transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${status === 'loading' ? 'animate-spin' : ''}`} strokeWidth={2} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setEditing({ sort_order: products.length + 1 })}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13px] font-medium uppercase tracking-[0.08em] text-canvas transition-colors hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Add product
          </button>
        </div>
      </div>

      {status === 'loading' && <p className="text-ink-soft">Loading products…</p>}
      {status === 'error' && <p className="text-red-600">Couldn't load products.</p>}

      {status === 'ready' && (
        <>
          {products.length === 0 && (
            <p className="rounded-[16px] border border-line bg-canvas p-6 text-center text-ink-soft">
              No products yet — add your first one.
            </p>
          )}

          {products.length > 0 && (
            <>
              {/* Desktop / tablet table */}
              <div className="hidden overflow-hidden rounded-[16px] border border-line bg-canvas md:block">
                <table className="w-full table-fixed text-left">
                  <colgroup>
                    <col className="w-[32%]" />
                    <col className="w-[20%]" />
                    <col className="w-[27%]" />
                    <col className="w-[8%]" />
                    <col className="w-[13%]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-line bg-ink/[0.02]">
                      <th className="px-4 py-3 text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">Product</th>
                      <th className="px-4 py-3 text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">Category</th>
                      <th className="px-4 py-3 text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">Tagline</th>
                      <th className="px-4 py-3 text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">Icon</th>
                      <th className="px-4 py-3 text-right text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProducts.map((product) => {
                      const IconComp = ICON_MAP[product.icon_key] ?? Egg
                      return (
                      <tr
                        key={product.id}
                        onClick={() => setEditing(product)}
                        className="cursor-pointer border-b border-line transition-colors last:border-b-0 hover:bg-ink/[0.03]"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {product.image_filename ? (
                              <img src={img(product.image_filename)} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" />
                            ) : (
                              <div className="h-10 w-10 shrink-0 rounded-md bg-ink/5" />
                            )}
                            <span className="truncate font-medium text-ink">{product.name}</span>
                          </div>
                        </td>
                        <td className="truncate px-4 py-3 text-[14px] text-ink-soft">{product.category}</td>
                        <td className="truncate px-4 py-3 text-[14px] text-ink-soft">{product.tagline}</td>
                        <td className="px-4 py-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/5 text-ink-soft">
                            <IconComp className="h-4 w-4" strokeWidth={1.75} />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditing(product)
                              }}
                              aria-label="Edit"
                              className="shrink-0 rounded-full p-2 text-ink-soft transition-colors hover:bg-ink/5 hover:text-primary"
                            >
                              <Pencil className="h-4 w-4" strokeWidth={2} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(product)
                              }}
                              disabled={deletingId === product.id}
                              aria-label="Delete"
                              className="shrink-0 rounded-full p-2 text-ink-soft transition-colors hover:bg-red-50 hover:text-red-600"
                            >
                              {deletingId === product.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                              ) : (
                                <Trash2 className="h-4 w-4" strokeWidth={2} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="overflow-hidden rounded-[16px] border border-line bg-canvas md:hidden">
                {paginatedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-4 border-b border-line p-4 last:border-b-0"
                  >
                    {product.image_filename ? (
                      <img src={img(product.image_filename)} alt="" className="h-14 w-14 shrink-0 rounded-md object-cover" />
                    ) : (
                      <div className="h-14 w-14 shrink-0 rounded-md bg-ink/5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink">{product.name}</p>
                      <p className="truncate text-[13px] text-ink-soft">{product.category} · {product.tagline}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditing(product)}
                      aria-label="Edit"
                      className="shrink-0 rounded-full p-2 text-ink-soft transition-colors hover:bg-ink/5 hover:text-primary"
                    >
                      <Pencil className="h-4 w-4" strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(product)}
                      disabled={deletingId === product.id}
                      aria-label="Delete"
                      className="shrink-0 rounded-full p-2 text-ink-soft transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      {deletingId === product.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                      ) : (
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {products.length > PAGE_SIZE && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-[13px] text-ink-soft">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="rounded-full border border-line px-4 py-2 text-[13px] font-medium uppercase tracking-[0.08em] text-ink-soft transition-colors hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink-soft"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="rounded-full border border-line px-4 py-2 text-[13px] font-medium uppercase tracking-[0.08em] text-ink-soft transition-colors hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink-soft"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}


      <AnimatePresence>
        {editing !== null && (
          <ProductForm
            initial={editing}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null)
              load()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
