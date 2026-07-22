import { useEffect, useState } from 'react'
import { Trash2, Loader2, Mail, X, Send } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import logoIcon from '../../assets/logo-icon-color.png'
import logoWordmark from '../../assets/logo-wordmark-color.png'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, { timeStyle: 'short' })
}

function formatFullTimestamp(iso) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })
}

function ModalBrandMark() {
  return (
    <div className="flex items-center gap-3">
      <img src={logoIcon} alt="" className="h-16 w-auto object-contain" />
      <img src={logoWordmark} alt="Talawan Global Farms" className="h-8 w-auto object-contain" />
    </div>
  )
}

function FieldRow({ label, children }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-ink-soft">{label}</p>
      <div className="rounded-[12px] bg-ink/[0.03] px-4 py-3">{children}</div>
    </div>
  )
}

function MessageModal({ message, onClose, onDelete, deletingId }) {
  if (!message) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-xl overflow-hidden rounded-[20px] border border-line bg-canvas shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-8 py-6">
          <ModalBrandMark />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-full p-2 text-ink-soft transition-colors hover:bg-ink/[0.06] hover:text-ink"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <div className="max-h-[calc(90vh-160px)] overflow-y-auto px-8 py-7">
          <div className="mb-6 flex items-center gap-2">
            <span className="h-px w-6 bg-primary" />
            <span className="text-[12px] font-medium uppercase tracking-[0.18em] text-primary">
              Contact enquiry
            </span>
          </div>

          <div className="space-y-4">
            <FieldRow label="Name">
              <p className="text-[15px] font-medium text-ink">{message.name}</p>
            </FieldRow>

            <FieldRow label="Email address">
              <a
                href={`mailto:${message.email}`}
                className="text-[15px] text-primary hover:underline"
              >
                {message.email}
              </a>
            </FieldRow>

            <FieldRow label="Date submitted">
              <p className="text-[14px] text-ink-soft">{formatFullTimestamp(message.created_at)}</p>
            </FieldRow>

            <FieldRow label="Message">
              <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink">
                {message.message}
              </p>
            </FieldRow>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line px-8 py-5">
          <button
            type="button"
            onClick={() => onDelete(message)}
            disabled={deletingId === message.id}
            className="flex items-center gap-2 rounded-full px-3 py-2 text-[13px] font-medium text-ink-soft transition-colors hover:bg-red-50 hover:text-red-600"
          >
            {deletingId === message.id ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
            ) : (
              <Trash2 className="h-4 w-4" strokeWidth={2} />
            )}
            Delete
          </button>
          <a
            href={`mailto:${message.email}`}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          >
            <Send className="h-4 w-4" strokeWidth={2} />
            Reply
          </a>
        </div>
      </div>
    </div>
  )
}

export default function AdminMessages() {
  const [messages, setMessages] = useState([])
  const [status, setStatus] = useState('loading')
  const [deletingId, setDeletingId] = useState(null)
  const [activeMessage, setActiveMessage] = useState(null)

  async function load() {
    setStatus('loading')
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      setStatus('error')
      return
    }
    setMessages(data ?? [])
    setStatus('ready')
  }

  useEffect(() => {
    load()
  }, [])

  async function handleDelete(message) {
    if (!window.confirm(`Delete the message from "${message.name}"?`)) return
    setDeletingId(message.id)
    const { error } = await supabase.from('contact_messages').delete().eq('id', message.id)
    setDeletingId(null)
    if (error) {
      alert(`Couldn't delete: ${error.message}`)
      return
    }
    if (activeMessage?.id === message.id) setActiveMessage(null)
    load()
  }

  return (
    <div>
      <div className="mb-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-px w-6 bg-primary" />
          <span className="text-[12px] font-medium uppercase tracking-[0.18em] text-primary">Get in touch</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-ink">
          Got a question?
          <br />
          We're listening.
        </h1>
      </div>

      {status === 'loading' && <p className="text-ink-soft">Loading messages…</p>}
      {status === 'error' && <p className="text-red-600">Couldn't load messages.</p>}

      {status === 'ready' && messages.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-[16px] border border-line bg-canvas p-12 text-center">
          <Mail className="h-6 w-6 text-ink-soft" strokeWidth={1.75} />
          <p className="text-ink-soft">No messages yet — enquiries submitted on the site will show up here.</p>
        </div>
      )}

      {status === 'ready' && messages.length > 0 && (
        <>
          {/* Desktop / tablet table */}
          <div className="hidden overflow-hidden rounded-[16px] border border-line bg-canvas md:block">
            <table className="w-full table-fixed text-left">
              <colgroup>
                <col className="w-[14%]" />
                <col className="w-[18%]" />
                <col className="w-[34%]" />
                <col className="w-[12%]" />
                <col className="w-[10%]" />
                <col className="w-[12%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-line bg-ink/[0.02]">
                  <th className="px-4 py-3 text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">Name</th>
                  <th className="px-4 py-3 text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">Email Address</th>
                  <th className="px-4 py-3 text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">Message</th>
                  <th className="px-4 py-3 text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">Date</th>
                  <th className="px-4 py-3 text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">Time</th>
                  <th className="px-4 py-3 text-right text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">Action</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((message) => (
                  <tr
                    key={message.id}
                    onClick={() => setActiveMessage(message)}
                    className="cursor-pointer border-b border-line transition-colors last:border-b-0 hover:bg-ink/[0.03]"
                  >
                    <td className="px-4 py-3">
                      <span className="truncate font-medium text-ink">{message.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`mailto:${message.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="truncate text-[13px] text-primary hover:underline"
                      >
                        {message.email}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <p className="line-clamp-2 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-soft">
                        {message.message}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-ink-soft">{formatDate(message.created_at)}</td>
                    <td className="px-4 py-3 text-[13px] text-ink-soft">{formatTime(message.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(message)
                          }}
                          disabled={deletingId === message.id}
                          aria-label="Delete"
                          className="shrink-0 rounded-full p-2 text-ink-soft transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          {deletingId === message.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                          ) : (
                            <Trash2 className="h-4 w-4" strokeWidth={2} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="space-y-3 md:hidden">
            {messages.map((message) => (
              <div
                key={message.id}
                onClick={() => setActiveMessage(message)}
                className="cursor-pointer rounded-[16px] border border-line bg-canvas p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{message.name}</p>
                    <a
                      href={`mailto:${message.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[13px] text-primary hover:underline"
                    >
                      {message.email}
                    </a>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-[12px] text-ink-soft/70">
                      {formatDate(message.created_at)} · {formatTime(message.created_at)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(message)
                      }}
                      disabled={deletingId === message.id}
                      aria-label="Delete"
                      className="rounded-full p-2 text-ink-soft transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      {deletingId === message.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                      ) : (
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                      )}
                    </button>
                  </div>
                </div>
                <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-[14px] leading-relaxed text-ink-soft">
                  {message.message}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      <MessageModal
        message={activeMessage}
        onClose={() => setActiveMessage(null)}
        onDelete={handleDelete}
        deletingId={deletingId}
      />
    </div>
  )
}
