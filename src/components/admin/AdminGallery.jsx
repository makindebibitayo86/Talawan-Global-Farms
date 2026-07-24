import { useEffect, useRef, useState } from 'react'
import { Upload, Trash2, Loader2, AlertCircle, GripVertical, Check, X, Pencil } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

const BUCKET = 'farm-images'
const SUPABASE_STORAGE_URL =
  'https://bhcyamtmorvzfckmlhfq.supabase.co/storage/v1/object/public/farm-images/'
const img = (filename) => `${SUPABASE_STORAGE_URL}${filename}`

function humanize(filename) {
  return filename
    .replace(/\.[^/.]+$/, '')
    .replace(/^farm-/, '')
    .replace(/-\d+$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function slugifyFilename(file) {
  const stamp = Date.now()
  const clean = file.name.trim().toLowerCase().replace(/[^a-z0-9.]+/g, '-')
  return `${stamp}-${clean}`
}

// Spacing between positions — leaves room for future inserts without a
// full resequence, though we resequence on every save anyway.
const ORDER_STEP = 10

const PAGE_SIZE = 15

export default function AdminGallery() {
  const [files, setFiles] = useState([])
  const [productMap, setProductMap] = useState(new Map())
  const [status, setStatus] = useState('loading')
  const [deletingName, setDeletingName] = useState(null)
  const [page, setPage] = useState(1)

  // Reordering — a separate working copy so drags don't touch `files`
  // until the admin explicitly saves.
  const [reordering, setReordering] = useState(false)
  const [reorderFiles, setReorderFiles] = useState([])
  const [savingOrder, setSavingOrder] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [dragIndex, setDragIndex] = useState(null)

  // Upload / edit-details modal — 'upload' adds a new photo (file + name +
  // category), 'edit' just updates name/category on an existing one.
  const [modalMode, setModalMode] = useState(null) // null | 'upload' | 'edit'
  const [modalTargetFile, setModalTargetFile] = useState(null) // the file being edited
  const [modalSelectedFile, setModalSelectedFile] = useState(null) // new File to upload
  const [modalPreviewUrl, setModalPreviewUrl] = useState('')
  const [modalName, setModalName] = useState('')
  const [modalCategory, setModalCategory] = useState('')
  const [modalDragOver, setModalDragOver] = useState(false)
  const [modalSubmitting, setModalSubmitting] = useState(false)
  const [modalError, setModalError] = useState('')
  const modalFileInputRef = useRef(null)

  async function load() {
    setStatus('loading')
    const [filesRes, productsRes, orderRes] = await Promise.all([
      supabase.storage.from(BUCKET).list('', { limit: 200 }),
      supabase.from('products').select('name, image_filename'),
      supabase.from('gallery_order').select('filename, sort_order, name, category'),
    ])

    if (filesRes.error || productsRes.error || orderRes.error) {
      console.error(filesRes.error || productsRes.error || orderRes.error)
      setStatus('error')
      return
    }

    setProductMap(new Map((productsRes.data ?? []).map((p) => [p.image_filename, p.name])))

    // Files without a saved position yet (predate this table, or a very
    // fresh upload) sort to the end, alphabetically among themselves.
    // metaName/metaCategory are only set once an admin has explicitly named
    // the photo via the upload/edit modal — until then, cards fall back to
    // the product name / humanized filename further down.
    const orderMap = new Map((orderRes.data ?? []).map((o) => [o.filename, o]))
    const sorted = (filesRes.data ?? [])
      .filter((f) => f.name && f.id)
      .map((f) => {
        const meta = orderMap.get(f.name)
        return {
          ...f,
          sortOrder: meta && meta.sort_order != null ? meta.sort_order : Infinity,
          metaName: meta?.name ?? null,
          metaCategory: meta?.category ?? null,
        }
      })
      .sort((a, b) =>
        a.sortOrder !== b.sortOrder ? a.sortOrder - b.sortOrder : a.name.localeCompare(b.name)
      )

    setFiles(sorted)
    setStatus('ready')
    setPage(1)
  }

  useEffect(() => {
    load()
  }, [])

  // Resolved display name/category for a card — prefers what the admin set
  // explicitly via the modal, then falls back to the old inference (product
  // name / humanized filename) so photos uploaded before this feature still
  // show something sensible.
  function displayFields(file) {
    const productName = productMap.get(file.name)
    return {
      name: file.metaName || productName || humanize(file.name),
      category: file.metaCategory || (productName ? 'Product' : 'Farm'),
    }
  }

  function openUploadModal() {
    setModalMode('upload')
    setModalTargetFile(null)
    setModalSelectedFile(null)
    setModalPreviewUrl('')
    setModalName('')
    setModalCategory('')
    setModalError('')
  }

  function openEditModal(file) {
    const { name, category } = displayFields(file)
    setModalMode('edit')
    setModalTargetFile(file)
    setModalSelectedFile(null)
    setModalPreviewUrl(img(file.name))
    setModalName(name)
    setModalCategory(category)
    setModalError('')
  }

  function closeModal() {
    if (modalSubmitting) return
    setModalMode(null)
  }

  function pickModalFile(file) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setModalError('Please choose an image file.')
      return
    }
    setModalError('')
    setModalSelectedFile(file)
    setModalPreviewUrl(URL.createObjectURL(file))
  }

  function handleModalDragOver(e) {
    e.preventDefault()
    setModalDragOver(true)
  }

  function handleModalDragLeave() {
    setModalDragOver(false)
  }

  function handleModalDrop(e) {
    e.preventDefault()
    setModalDragOver(false)
    pickModalFile(e.dataTransfer.files?.[0])
  }

  async function submitModal() {
    const trimmedName = modalName.trim()
    const trimmedCategory = modalCategory.trim()
    if (!trimmedName || !trimmedCategory) {
      setModalError('Give the photo a name and a category.')
      return
    }
    if (modalMode === 'upload' && !modalSelectedFile) {
      setModalError('Choose an image to upload.')
      return
    }

    setModalSubmitting(true)
    setModalError('')

    if (modalMode === 'upload') {
      const filename = slugifyFilename(modalSelectedFile)
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(filename, modalSelectedFile, { upsert: true })
      if (error) {
        setModalSubmitting(false)
        setModalError(error.message)
        return
      }

      const finiteOrders = files.map((f) => f.sortOrder).filter((n) => Number.isFinite(n))
      const nextOrder = finiteOrders.length ? Math.max(...finiteOrders) + ORDER_STEP : 0
      const { error: orderErr } = await supabase
        .from('gallery_order')
        .insert({ filename, sort_order: nextOrder, name: trimmedName, category: trimmedCategory })
      if (orderErr) {
        setModalSubmitting(false)
        setModalError(`Image uploaded, but saving its details failed: ${orderErr.message}`)
        return
      }
    } else {
      // Upsert (rather than a plain update) so this still works even for a
      // photo whose gallery_order row is somehow missing.
      const targetOrder = Number.isFinite(modalTargetFile.sortOrder)
        ? modalTargetFile.sortOrder
        : (() => {
            const finiteOrders = files.map((f) => f.sortOrder).filter((n) => Number.isFinite(n))
            return finiteOrders.length ? Math.max(...finiteOrders) + ORDER_STEP : 0
          })()
      const { error } = await supabase.from('gallery_order').upsert(
        {
          filename: modalTargetFile.name,
          name: trimmedName,
          category: trimmedCategory,
          sort_order: targetOrder,
        },
        { onConflict: 'filename' }
      )
      if (error) {
        setModalSubmitting(false)
        setModalError(error.message)
        return
      }
    }

    setModalSubmitting(false)
    setModalMode(null)
    load()
  }

  async function handleDelete(file) {
    const usedBy = productMap.get(file.name)
    const warning = usedBy
      ? `"${file.name}" is currently used as the photo for the product "${usedBy}". Deleting it will break that product's image. Delete anyway?`
      : `Delete "${file.name}"? This can't be undone.`
    if (!window.confirm(warning)) return

    setDeletingName(file.name)
    const { error } = await supabase.storage.from(BUCKET).remove([file.name])
    if (error) {
      setDeletingName(null)
      alert(`Couldn't delete: ${error.message}`)
      return
    }

    const { error: orderErr } = await supabase.from('gallery_order').delete().eq('filename', file.name)
    if (orderErr) console.error('Failed to clean up order row for deleted file:', orderErr)

    setDeletingName(null)
    load()
  }

  function startReordering() {
    setOrderError('')
    setReorderFiles(files)
    setReordering(true)
  }

  function cancelReordering() {
    setReordering(false)
    setDragIndex(null)
  }

  function handleDragStart(index) {
    setDragIndex(index)
  }

  function handleDragOver(e, index) {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return
    setReorderFiles((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(index, 0, moved)
      return next
    })
    setDragIndex(index)
  }

  function handleDragEnd() {
    setDragIndex(null)
  }

  async function saveOrder() {
    setSavingOrder(true)
    setOrderError('')
    const rows = reorderFiles.map((f, i) => ({ filename: f.name, sort_order: i * ORDER_STEP }))
    const { error } = await supabase.from('gallery_order').upsert(rows, { onConflict: 'filename' })
    setSavingOrder(false)
    if (error) {
      setOrderError(error.message || 'Failed to save the new order.')
      return
    }
    setReordering(false)
    setDragIndex(null)
    load()
  }

  const categoryOptions = Array.from(new Set(files.map((f) => f.metaCategory).filter(Boolean))).sort()

  const totalPages = Math.max(1, Math.ceil(files.length / PAGE_SIZE))
  const paginatedFiles = reordering ? reorderFiles : files.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-px w-6 bg-primary" />
            <span className="text-[12px] font-medium uppercase tracking-[0.18em] text-primary">Gallery</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-ink">A look into our world</h1>
        </div>

        <div className="flex items-center gap-3">
          {reordering ? (
            <>
              <button
                type="button"
                onClick={cancelReordering}
                disabled={savingOrder}
                className="flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-[13px] font-medium uppercase tracking-[0.08em] text-ink-soft transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-60"
              >
                <X className="h-4 w-4" strokeWidth={2} />
                Cancel
              </button>
              <button
                type="button"
                onClick={saveOrder}
                disabled={savingOrder}
                className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13px] font-medium uppercase tracking-[0.08em] text-canvas transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
              >
                {savingOrder ? (
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                ) : (
                  <Check className="h-4 w-4" strokeWidth={2} />
                )}
                {savingOrder ? 'Saving…' : 'Save order'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={startReordering}
                disabled={status !== 'ready' || files.length < 2}
                className="flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-[13px] font-medium uppercase tracking-[0.08em] text-ink transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <GripVertical className="h-4 w-4" strokeWidth={2} />
                Reorder
              </button>
              <button
                type="button"
                onClick={openUploadModal}
                disabled={status !== 'ready'}
                className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13px] font-medium uppercase tracking-[0.08em] text-canvas transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Upload className="h-4 w-4" strokeWidth={2} />
                Upload image
              </button>
            </>
          )}
        </div>
      </div>

      <p className="mb-4 text-[15px] font-medium text-ink-soft">
        {reordering ? (
          <>
            Drag a photo to move it — this is the order shown in the Gallery
            <br />
            strip on the site. Nothing is saved until you press "Save order".
          </>
        ) : (
          <>
            Every image here shows on the site's Gallery strip, using
            <br />
            the name and category you give it. Click the pencil on a
            <br />
            photo to edit those details anytime.
          </>
        )}
      </p>

      {orderError && (
        <p className="mb-4 flex items-center gap-2 text-sm font-medium text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          {orderError}
        </p>
      )}

      {status === 'loading' && <p className="text-ink-soft">Loading gallery…</p>}
      {status === 'error' && <p className="text-red-600">Couldn't load the gallery.</p>}

      {status === 'ready' && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {paginatedFiles.map((file, index) => {
              const { name: displayName, category: displayCategory } = displayFields(file)
              return (
                <div
                  key={file.id}
                  draggable={reordering}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`group relative overflow-hidden rounded-[16px] border bg-canvas transition ${
                    reordering
                      ? `cursor-grab border-line active:cursor-grabbing ${
                          dragIndex === index ? 'opacity-50' : ''
                        }`
                      : 'border-line'
                  }`}
                >
                  <div className="aspect-square w-full overflow-hidden">
                    <img src={img(file.name)} alt="" draggable="false" className="h-full w-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="truncate text-[13px] font-medium text-ink">{displayName}</p>
                    <span className="text-[11px] uppercase tracking-[0.06em] text-ink-soft/70">
                      {displayCategory}
                    </span>
                  </div>
                  {reordering ? (
                    <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-canvas/90 text-ink-soft shadow-sm backdrop-blur-sm">
                      <GripVertical className="h-4 w-4" strokeWidth={2} />
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => openEditModal(file)}
                        aria-label="Edit name and category"
                        className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-canvas/90 text-ink-soft shadow-sm backdrop-blur-sm transition-colors hover:bg-primary/10 hover:text-primary"
                      >
                        <Pencil className="h-4 w-4" strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(file)}
                        disabled={deletingName === file.name}
                        aria-label="Delete image"
                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-canvas/90 text-ink-soft shadow-sm backdrop-blur-sm transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        {deletingName === file.name ? (
                          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                        ) : (
                          <Trash2 className="h-4 w-4" strokeWidth={2} />
                        )}
                      </button>
                    </>
                  )}
                </div>
              )
            })}
          </div>

          {!reordering && files.length > PAGE_SIZE && (
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

      {modalMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 sm:p-8"
          onClick={closeModal}
        >
          <div
            className="flex h-[92vh] max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[24px] border border-line bg-canvas shadow-xl md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left column — the image, shown in full with nothing cropped off */}
            <div className="relative flex flex-1 self-stretch bg-line/10 p-6">
              {modalMode === 'upload' && !modalPreviewUrl ? (
                <div
                  onDragOver={handleModalDragOver}
                  onDragLeave={handleModalDragLeave}
                  onDrop={handleModalDrop}
                  onClick={() => modalFileInputRef.current?.click()}
                  className={`flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-[16px] border-2 border-dashed p-6 text-center transition-colors ${
                    modalDragOver
                      ? 'border-primary bg-primary/5'
                      : 'border-ink-soft/30 bg-canvas/40 hover:border-primary/50 hover:bg-canvas/60'
                  }`}
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Upload className="h-6 w-6" strokeWidth={1.75} />
                  </span>
                  <p className="text-[14px] font-medium text-ink">
                    Drag & drop an image here
                  </p>
                  <p className="text-[13px] text-ink-soft">or click to browse your files</p>
                  <input
                    ref={modalFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => pickModalFile(e.target.files?.[0])}
                  />
                </div>
              ) : (
                <div
                  onDragOver={modalMode === 'upload' ? handleModalDragOver : undefined}
                  onDragLeave={modalMode === 'upload' ? handleModalDragLeave : undefined}
                  onDrop={modalMode === 'upload' ? handleModalDrop : undefined}
                  onClick={modalMode === 'upload' ? () => modalFileInputRef.current?.click() : undefined}
                  className={`flex w-full flex-col items-center justify-center gap-3 rounded-[16px] ${
                    modalMode === 'upload' ? 'cursor-pointer' : ''
                  } ${
                    modalMode === 'upload' && modalDragOver
                      ? 'ring-2 ring-inset ring-primary bg-primary/5'
                      : ''
                  }`}
                >
                  <img
                    src={modalPreviewUrl}
                    alt=""
                    className="max-h-full max-w-full rounded-[12px] object-contain shadow-sm"
                    style={{ maxHeight: '78vh' }}
                  />
                  {modalMode === 'upload' && (
                    <>
                      <p className="text-[13px] font-medium text-ink-soft">
                        {modalSelectedFile.name} — click or drop to replace
                      </p>
                      <input
                        ref={modalFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => pickModalFile(e.target.files?.[0])}
                      />
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Right column — the details form */}
            <div className="flex w-full flex-col overflow-y-auto p-6 md:w-[360px] md:shrink-0 md:p-8">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-ink">
                  {modalMode === 'upload' ? 'Upload image' : 'Edit details'}
                </h2>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={modalSubmitting}
                  aria-label="Close"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-line/40 disabled:opacity-50"
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>

              <div className="mb-4">
                <label className="mb-1 block text-[12px] font-medium uppercase tracking-[0.08em] text-ink-soft">
                  Display name
                </label>
                <input
                  type="text"
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  placeholder="e.g. Free-range hens at sunrise"
                  className="w-full rounded-[10px] border border-line bg-canvas px-3 py-2 text-[14px] text-ink outline-none focus:border-primary"
                />
              </div>

              <div className="mb-6">
                <label className="mb-1 block text-[12px] font-medium uppercase tracking-[0.08em] text-ink-soft">
                  Category
                </label>
                <input
                  type="text"
                  list="gallery-categories"
                  value={modalCategory}
                  onChange={(e) => setModalCategory(e.target.value)}
                  placeholder="e.g. Poultry"
                  className="w-full rounded-[10px] border border-line bg-canvas px-3 py-2 text-[14px] text-ink outline-none focus:border-primary"
                />
                <datalist id="gallery-categories">
                  {categoryOptions.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              {modalError && (
                <p className="mb-4 flex items-center gap-2 text-[13px] font-medium text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  {modalError}
                </p>
              )}

              <div className="mt-auto flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={modalSubmitting}
                  className="rounded-full border border-line px-4 py-2.5 text-[13px] font-medium uppercase tracking-[0.08em] text-ink-soft transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitModal}
                  disabled={modalSubmitting}
                  className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13px] font-medium uppercase tracking-[0.08em] text-canvas transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {modalSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                  ) : (
                    <Check className="h-4 w-4" strokeWidth={2} />
                  )}
                  {modalSubmitting ? 'Saving…' : modalMode === 'upload' ? 'Upload' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
