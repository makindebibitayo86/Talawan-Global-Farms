import { useEffect, useRef, useState } from 'react'
import {
  Upload, Trash2, Loader2, AlertCircle, GripVertical, Check, X, Pencil, Plus, Users,
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

const BUCKET = 'team-photos'
const SUPABASE_STORAGE_URL =
  'https://bhcyamtmorvzfckmlhfq.supabase.co/storage/v1/object/public/team-photos/'
const img = (filename) => `${SUPABASE_STORAGE_URL}${filename}`

function slugifyFilename(file) {
  const stamp = Date.now()
  const clean = file.name.trim().toLowerCase().replace(/[^a-z0-9.]+/g, '-')
  return `${stamp}-${clean}`
}

// Spacing between positions — leaves room for future inserts without a
// full resequence, though we resequence on every save anyway.
const ORDER_STEP = 10

const PAGE_SIZE_MOBILE = 10
const PAGE_SIZE_DEFAULT = 12
const MOBILE_QUERY = '(max-width: 639px)'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MOBILE_QUERY).matches : false
  )

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY)
    const handler = (e) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return isMobile
}

function DeleteConfirmModal({ member, onCancel, onConfirm, deleting }) {
  useEffect(() => {
    if (!member) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [member])

  if (!member) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-[20px] border border-line bg-canvas shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-7 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/50">
            <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" strokeWidth={2} />
          </div>
          <h3 className="mb-2 text-[16px] font-semibold text-ink">Remove this team member?</h3>
          <p className="text-[13px] leading-relaxed text-ink-soft">
            <span className="font-medium text-ink">{member.name}</span> ({member.role}) will be
            permanently removed from the Team section. This can't be undone.
          </p>
        </div>
        <div className="flex border-t border-line">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 py-3.5 text-[13px] font-medium uppercase tracking-[0.08em] text-ink-soft transition-colors hover:bg-ink/[0.04] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex flex-1 items-center justify-center gap-2 border-l border-line py-3.5 text-[13px] font-medium uppercase tracking-[0.08em] text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            {deleting && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
            {deleting ? 'Removing' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminTeam() {
  const isMobile = useIsMobile()
  const PAGE_SIZE = isMobile ? PAGE_SIZE_MOBILE : PAGE_SIZE_DEFAULT
  const [members, setMembers] = useState([])
  const [status, setStatus] = useState('loading')
  const [deletingId, setDeletingId] = useState(null)
  const [confirmDeleteMember, setConfirmDeleteMember] = useState(null)
  const [page, setPage] = useState(1)

  // Reordering — a separate working copy so drags don't touch `members`
  // until the admin explicitly saves.
  const [reordering, setReordering] = useState(false)
  const [reorderMembers, setReorderMembers] = useState([])
  const [savingOrder, setSavingOrder] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [dragIndex, setDragIndex] = useState(null)

  // Add / edit modal — 'add' creates a new member (photo optional), 'edit'
  // updates an existing one, optionally replacing the photo.
  const [modalMode, setModalMode] = useState(null) // null | 'add' | 'edit'
  const [modalTarget, setModalTarget] = useState(null) // the member being edited
  const [modalSelectedFile, setModalSelectedFile] = useState(null) // new File to upload
  const [modalPreviewUrl, setModalPreviewUrl] = useState('')
  const [modalRemovePhoto, setModalRemovePhoto] = useState(false)
  const [modalName, setModalName] = useState('')
  const [modalRole, setModalRole] = useState('')
  const [modalBio, setModalBio] = useState('')
  const [modalDragOver, setModalDragOver] = useState(false)
  const [modalSubmitting, setModalSubmitting] = useState(false)
  const [modalError, setModalError] = useState('')
  const modalFileInputRef = useRef(null)

  async function load() {
    setStatus('loading')
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error(error)
      setStatus('error')
      return
    }

    setMembers(data ?? [])
    setStatus('ready')
    setPage(1)
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [isMobile])

  useEffect(() => {
    if (!modalMode) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [modalMode])

  function openAddModal() {
    setModalMode('add')
    setModalTarget(null)
    setModalSelectedFile(null)
    setModalPreviewUrl('')
    setModalRemovePhoto(false)
    setModalName('')
    setModalRole('')
    setModalBio('')
    setModalError('')
  }

  function openEditModal(member) {
    setModalMode('edit')
    setModalTarget(member)
    setModalSelectedFile(null)
    setModalPreviewUrl(member.photo_filename ? img(member.photo_filename) : '')
    setModalRemovePhoto(false)
    setModalName(member.name)
    setModalRole(member.role)
    setModalBio(member.bio || '')
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
    setModalRemovePhoto(false)
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

  function removePhoto() {
    setModalSelectedFile(null)
    setModalPreviewUrl('')
    setModalRemovePhoto(true)
  }

  async function submitModal() {
    const trimmedName = modalName.trim()
    const trimmedRole = modalRole.trim()
    const trimmedBio = modalBio.trim()
    if (!trimmedName || !trimmedRole) {
      setModalError('Give this person a name and a role.')
      return
    }

    setModalSubmitting(true)
    setModalError('')

    // Upload a new photo if one was picked — same for both add and edit.
    let photoFilename = modalMode === 'edit' ? modalTarget.photo_filename : null
    if (modalSelectedFile) {
      const filename = slugifyFilename(modalSelectedFile)
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(filename, modalSelectedFile, { upsert: true })
      if (error) {
        setModalSubmitting(false)
        setModalError(error.message)
        return
      }
      photoFilename = filename
    } else if (modalRemovePhoto) {
      photoFilename = null
    }

    if (modalMode === 'add') {
      const finiteOrders = members.map((m) => m.sort_order).filter((n) => Number.isFinite(n))
      const nextOrder = finiteOrders.length ? Math.max(...finiteOrders) + ORDER_STEP : 0
      const { error } = await supabase.from('team_members').insert({
        name: trimmedName,
        role: trimmedRole,
        bio: trimmedBio,
        photo_filename: photoFilename,
        sort_order: nextOrder,
      })
      if (error) {
        setModalSubmitting(false)
        setModalError(error.message)
        return
      }
    } else {
      const { error } = await supabase
        .from('team_members')
        .update({
          name: trimmedName,
          role: trimmedRole,
          bio: trimmedBio,
          photo_filename: photoFilename,
          updated_at: new Date().toISOString(),
        })
        .eq('id', modalTarget.id)
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

  function handleDelete(member) {
    setConfirmDeleteMember(member)
  }

  async function performDelete() {
    const member = confirmDeleteMember
    if (!member) return

    setDeletingId(member.id)

    if (member.photo_filename) {
      const { error: storageErr } = await supabase.storage.from(BUCKET).remove([member.photo_filename])
      if (storageErr) console.error('Failed to remove photo file:', storageErr)
    }

    const { error } = await supabase.from('team_members').delete().eq('id', member.id)
    if (error) {
      setDeletingId(null)
      alert(`Couldn't remove: ${error.message}`)
      return
    }

    setDeletingId(null)
    setConfirmDeleteMember(null)
    load()
  }

  function startReordering() {
    setOrderError('')
    setReorderMembers(members)
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
    setReorderMembers((prev) => {
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
    const updates = reorderMembers.map((m, i) =>
      supabase.from('team_members').update({ sort_order: i * ORDER_STEP }).eq('id', m.id)
    )
    const results = await Promise.all(updates)
    const failed = results.find((r) => r.error)
    setSavingOrder(false)
    if (failed) {
      setOrderError(failed.error.message || 'Failed to save the new order.')
      return
    }
    setReordering(false)
    setDragIndex(null)
    load()
  }

  const totalPages = Math.max(1, Math.ceil(members.length / PAGE_SIZE))
  const displayMembers = reordering
    ? reorderMembers
    : members.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-px w-6 bg-primary" />
            <span className="text-[12px] font-medium uppercase tracking-[0.18em] text-primary">Team</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-ink">The people behind the farm</h1>
        </div>

        <div className="flex items-center gap-3">
          {reordering ? (
            <>
              <button
                type="button"
                onClick={cancelReordering}
                disabled={savingOrder}
                className="flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-[13px] font-medium uppercase tracking-[0.08em] text-ink-soft transition-colors hover:border-red-300 hover:text-red-600 dark:hover:border-red-900 dark:hover:text-red-400 disabled:opacity-60"
              >
                <X className="h-4 w-4" strokeWidth={2} />
                Cancel
              </button>
              <button
                type="button"
                onClick={saveOrder}
                disabled={savingOrder}
                className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[13px] font-medium uppercase tracking-[0.08em] text-canvas transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
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
              {members.length > 1 && (
                <button
                  type="button"
                  onClick={startReordering}
                  className="flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-[13px] font-medium uppercase tracking-[0.08em] text-ink-soft transition-colors hover:border-primary hover:text-primary"
                >
                  <GripVertical className="h-4 w-4" strokeWidth={2} />
                  Reorder
                </button>
              )}
              <button
                type="button"
                onClick={openAddModal}
                className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[13px] font-medium uppercase tracking-[0.08em] text-canvas transition-colors hover:bg-primary-dark"
              >
                <Plus className="h-4 w-4" strokeWidth={2} />
                Add member
              </button>
            </>
          )}
        </div>
      </div>

      {orderError && (
        <p className="mb-4 flex items-center gap-2 text-[13px] font-medium text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          {orderError}
        </p>
      )}

      {status === 'loading' && (
        <div className="flex items-center justify-center gap-2 py-20 text-ink-soft">
          <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.75} />
          <span className="text-[14px] font-medium">Loading team…</span>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center justify-center gap-2 py-20 text-red-600 dark:text-red-400">
          <AlertCircle className="h-5 w-5" strokeWidth={1.75} />
          <span className="text-[14px] font-medium">Couldn't load the team. Try refreshing.</span>
        </div>
      )}

      {status === 'ready' && members.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-line py-20 text-center">
          <Users className="h-8 w-8 text-ink-soft/50" strokeWidth={1.5} />
          <p className="text-[14px] font-medium text-ink-soft">No team members yet.</p>
          <button
            type="button"
            onClick={openAddModal}
            className="mt-1 flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[13px] font-medium uppercase tracking-[0.08em] text-canvas transition-colors hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Add the first one
          </button>
        </div>
      )}

      {status === 'ready' && members.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {displayMembers.map((member, index) => (
            <div
              key={member.id}
              draggable={reordering}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => !reordering && openEditModal(member)}
              className={`group relative overflow-hidden rounded-[20px] border border-line bg-canvas-alt/40 transition-shadow ${
                reordering ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer hover:border-primary/40'
              } ${dragIndex === index ? 'opacity-50' : ''}`}
            >
              <div className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden bg-ink/5">
                {member.photo_filename ? (
                  <img
                    src={img(member.photo_filename)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Users className="h-10 w-10 text-ink/20" strokeWidth={1.5} />
                )}

                {reordering && (
                  <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white">
                    <GripVertical className="h-4 w-4" strokeWidth={2} />
                  </span>
                )}

                {!reordering && (
                  <div className="absolute inset-0 flex items-start justify-end gap-1.5 bg-black/0 p-2 opacity-0 transition-opacity group-hover:bg-black/10 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditModal(member)
                      }}
                      aria-label={`Edit ${member.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm transition hover:bg-white"
                    >
                      <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(member)
                      }}
                      aria-label={`Remove ${member.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-600 shadow-sm transition hover:bg-white"
                    >
                      {deletingId === member.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="p-3">
                <p className="truncate text-[13px] font-semibold text-ink">{member.name}</p>
                <p className="truncate text-[12px] text-ink-soft">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {status === 'ready' && !reordering && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-full border border-line px-4 py-2 text-[13px] font-medium uppercase tracking-[0.08em] text-ink-soft transition-colors hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink-soft"
          >
            Previous
          </button>
          <span className="text-[13px] font-medium text-ink-soft">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-full border border-line px-4 py-2 text-[13px] font-medium uppercase tracking-[0.08em] text-ink-soft transition-colors hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink-soft"
          >
            Next
          </button>
        </div>
      )}

      {modalMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm sm:p-8"
          onClick={closeModal}
        >
          <div
            className="flex h-[92vh] max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[24px] border border-line bg-canvas shadow-xl md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left column — photo, optional */}
            <div className="relative flex flex-1 self-stretch bg-line/10 p-6">
              {!modalPreviewUrl ? (
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
                  <p className="text-[14px] font-medium text-ink">Drag & drop a photo here</p>
                  <p className="text-[13px] text-ink-soft">
                    or click to browse — optional, can be added later
                  </p>
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
                  onDragOver={handleModalDragOver}
                  onDragLeave={handleModalDragLeave}
                  onDrop={handleModalDrop}
                  className="flex w-full flex-col items-center justify-center gap-3 rounded-[16px]"
                >
                  <img
                    src={modalPreviewUrl}
                    alt=""
                    className="max-h-full max-w-full rounded-[12px] object-contain shadow-sm"
                    style={{ maxHeight: '70vh' }}
                  />
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => modalFileInputRef.current?.click()}
                      className="text-[13px] font-medium text-primary underline underline-offset-2"
                    >
                      Replace photo
                    </button>
                    <span className="text-ink-soft/40">·</span>
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="text-[13px] font-medium text-red-600 underline underline-offset-2 dark:text-red-400"
                    >
                      Remove photo
                    </button>
                  </div>
                  <input
                    ref={modalFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => pickModalFile(e.target.files?.[0])}
                  />
                </div>
              )}
            </div>

            {/* Right column — details form */}
            <div className="flex w-full flex-col overflow-y-auto p-6 md:w-[460px] md:shrink-0 md:p-10">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-ink">
                  {modalMode === 'add' ? 'Add team member' : 'Edit team member'}
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

              <div className="mb-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[12px] font-medium uppercase tracking-[0.08em] text-ink-soft">
                    Name
                  </label>
                  <input
                    type="text"
                    value={modalName}
                    onChange={(e) => setModalName(e.target.value)}
                    placeholder="e.g. Amina Yusuf"
                    className="w-full rounded-[10px] border border-line bg-canvas px-3 py-2 text-[14px] text-ink outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[12px] font-medium uppercase tracking-[0.08em] text-ink-soft">
                    Role
                  </label>
                  <input
                    type="text"
                    value={modalRole}
                    onChange={(e) => setModalRole(e.target.value)}
                    placeholder="e.g. Farm Manager"
                    className="w-full rounded-[10px] border border-line bg-canvas px-3 py-2 text-[14px] text-ink outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="mb-1 block text-[12px] font-medium uppercase tracking-[0.08em] text-ink-soft">
                  Bio
                </label>
                <p className="mb-2 text-[12px] text-ink-soft/80">3 short sentences, one per line.</p>
                <textarea
                  rows={9}
                  value={modalBio}
                  onChange={(e) => setModalBio(e.target.value)}
                  placeholder={
                    'Farm Manager dedicated to keeping daily operations running smoothly.\nHas experience in resource planning, team coordination, and yield optimization.\nCommitted to quality, productivity, and the people who make the farm work.'
                  }
                  className="w-full rounded-[10px] border border-line bg-canvas px-3 py-2 text-[14px] text-ink outline-none focus:border-primary"
                />
                <p
                  className={`mt-1 text-right text-[11px] ${
                    modalBio.length > 480 ? 'text-red-600 dark:text-red-400' : 'text-ink-soft/60'
                  }`}
                >
                  {modalBio.length}/480 {modalBio.length > 480 ? '— likely to get cut off' : ''}
                </p>
              </div>

              {modalError && (
                <p className="mb-4 flex items-center gap-2 text-[13px] font-medium text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  {modalError}
                </p>
              )}

              <div className="mt-auto flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={modalSubmitting}
                  className="rounded-full border border-line px-4 py-2.5 text-[13px] font-medium uppercase tracking-[0.08em] text-ink-soft transition-colors hover:border-red-300 hover:text-red-600 dark:hover:border-red-900 dark:hover:text-red-400 disabled:opacity-60"
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
                  {modalSubmitting ? 'Saving…' : modalMode === 'add' ? 'Add member' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        member={confirmDeleteMember}
        onCancel={() => setConfirmDeleteMember(null)}
        onConfirm={performDelete}
        deleting={deletingId === confirmDeleteMember?.id}
      />
    </div>
  )
}
