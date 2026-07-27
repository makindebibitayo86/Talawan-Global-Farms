import { useEffect, useState } from 'react'
import { Trash2, Loader2, Mail, X, Send, RefreshCw, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { sendReplyToEnquirer } from '../../lib/emailjs'
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

function ReplyBadge({ count }) {
  if (!count) {
    return (
      <span className="inline-flex animate-pulse items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[12px] font-medium text-red-700 dark:bg-red-950/50 dark:text-red-400">
        <span className="h-1.5 w-1.5 rounded-full bg-red-600 dark:bg-red-400" />
        Awaiting reply
      </span>
    )
  }
  if (count === 1) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-[12px] font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
        1 reply
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[12px] font-medium text-green-700 dark:bg-green-950/50 dark:text-green-400">
      <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
      {count} replies
    </span>
  )
}

function ModalBrandMark() {
  return (
    <div className="flex items-center gap-3">
      <img src={logoIcon} alt="" className="h-16 w-auto object-contain" />
      <img src={logoWordmark} alt="Talawan Global Farms" className="h-8 w-auto object-contain" />
    </div>
  )
}

function FieldRow({ label, children, tone = 'neutral' }) {
  const toneClass =
    tone === 'received'
      ? 'border-l-[3px] border-blue-400 bg-gradient-to-br from-blue-500/15 via-blue-500/[0.06] to-transparent dark:from-blue-400/20 dark:via-blue-400/[0.08]'
      : 'bg-ink/[0.03]'
  return (
    <div>
      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-ink-soft">{label}</p>
      <div className={`rounded-[12px] px-4 py-3 ${toneClass}`}>{children}</div>
    </div>
  )
}

function DeleteConfirmModal({ message, onCancel, onConfirm, deleting }) {
  // Prevent the page behind the modal from scrolling while it's open.
  useEffect(() => {
    if (!message) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [message])

  if (!message) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-[20px] border border-line glass-modal shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-7 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/50">
            <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" strokeWidth={2} />
          </div>
          <h3 className="mb-2 text-[16px] font-semibold text-ink">Delete this message?</h3>
          <p className="text-[13px] leading-relaxed text-ink-soft">
            The enquiry from <span className="font-medium text-ink">{message.name}</span> will be
            permanently removed, along with its reply history. This can't be undone.
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
            {deleting ? 'Deleting' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

function MessageModal({ message, onClose, replies, repliesStatus, onReplySent }) {
  const [replyText, setReplyText] = useState('')
  const [sendStatus, setSendStatus] = useState('idle') // idle | sending | success | error

  // Reset the reply form whenever a different message is opened.
  useEffect(() => {
    setReplyText('')
    setSendStatus('idle')
  }, [message?.id])

  // Prevent the page behind the modal from scrolling while it's open.
  useEffect(() => {
    if (!message) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [message])

  if (!message) return null

  async function handleSend(e) {
    e.preventDefault()
    setSendStatus('sending')
    try {
      await sendReplyToEnquirer({
        toName: message.name,
        toEmail: message.email,
        replyMessage: replyText,
      })
      setSendStatus('success')
      setReplyText('')

      // Save the reply to the thread — best-effort. The email already went
      // out, so a failure here just means it won't show up in the thread
      // history, not that the reply itself failed.
      const { data, error } = await supabase
        .from('message_replies')
        .insert([{ message_id: message.id, reply_text: replyText }])
        .select()
        .single()

      if (error) {
        console.error('Saving reply to thread failed:', error)
      } else {
        onReplySent(data)
      }
    } catch (err) {
      console.error('Reply email failed:', err)
      setSendStatus('error')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-[20px] border border-line glass-modal shadow-xl"
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

        <div className="grid max-h-[calc(90vh-160px)] grid-cols-1 divide-y divide-line overflow-y-auto md:grid-cols-2 md:divide-x md:divide-y-0">
          {/* Left column: enquiry details + reply history */}
          <div className="px-8 py-7">
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
                <p className="text-[15px] text-ink">{message.email}</p>
              </FieldRow>

              {message.phone && (
                <FieldRow label="Phone number">
                  <p className="text-[15px] text-ink">{message.phone}</p>
                </FieldRow>
              )}

              <FieldRow label="Date submitted">
                <p className="text-[14px] text-ink-soft">{formatFullTimestamp(message.created_at)}</p>
              </FieldRow>

              <FieldRow label="Message" tone="received">
                <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink">
                  {message.message}
                </p>
              </FieldRow>
            </div>
          </div>

          {/* Right column: reply history + reply form */}
          <div className="flex flex-col px-8 py-7">
            <div className="mb-4 flex items-center gap-2">
              <span className="h-px w-6 bg-primary" />
              <span className="text-[12px] font-medium uppercase tracking-[0.18em] text-primary">
                Replies{replies.length > 0 ? ` (${replies.length})` : ''}
              </span>
            </div>

            {repliesStatus === 'loading' && (
              <p className="text-[13px] text-ink-soft">Loading replies…</p>
            )}
            {repliesStatus === 'error' && (
              <p className="text-[13px] text-red-600 dark:text-red-400">Couldn't load replies.</p>
            )}
            {repliesStatus === 'ready' && replies.length === 0 && (
              <p className="text-[13px] text-ink-soft">No replies sent yet.</p>
            )}
            {repliesStatus === 'ready' && replies.length > 0 && (
              <div className="mb-6 space-y-3">
                {replies.map((reply) => (
                  <div key={reply.id} className="rounded-[12px] border-l-[3px] border-primary bg-primary/10 px-4 py-3">
                    <p className="mb-1 text-[11px] font-medium text-ink-soft">
                      You replied · {formatFullTimestamp(reply.created_at)}
                    </p>
                    <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink">
                      {reply.reply_text}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="mb-4 mt-2 flex items-center gap-2">
              <span className="h-px w-6 bg-primary" />
              <span className="text-[12px] font-medium uppercase tracking-[0.18em] text-primary">
                Send a reply
              </span>
            </div>

            <form onSubmit={handleSend} className="flex flex-1 flex-col">
              <label
                htmlFor="reply-message"
                className="mb-2 block text-[11px] font-medium uppercase tracking-[0.1em] text-ink-soft"
              >
                Your reply
              </label>
              <textarea
                id="reply-message"
                required
                rows={6}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Hi ${message.name}, thanks for reaching out...`}
                disabled={sendStatus === 'sending'}
                className="w-full flex-1 resize-none rounded-[12px] border border-line bg-canvas px-4 py-3 text-[14px] text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-60"
              />

              {sendStatus === 'success' && (
                <p className="mt-3 text-sm font-medium text-primary">
                  Reply sent to {message.email}.
                </p>
              )}
              {sendStatus === 'error' && (
                <p className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">
                  Couldn't send the reply. Please try again.
                </p>
              )}

              <button
                type="submit"
                disabled={sendStatus === 'sending' || !replyText.trim()}
                className="mt-4 flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sendStatus === 'sending' ? (
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                ) : (
                  <Send className="h-4 w-4" strokeWidth={2} />
                )}
                {sendStatus === 'sending' ? 'Sending' : 'Send reply'}
              </button>
            </form>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line px-8 py-14">
          {/* placeholder — footer content TBD */}
        </div>
      </div>
    </div>
  )
}

const PAGE_SIZE = 10

export default function AdminMessages() {
  const [messages, setMessages] = useState([])
  const [status, setStatus] = useState('loading')
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [activeMessage, setActiveMessage] = useState(null)
  const [replies, setReplies] = useState([])
  const [repliesStatus, setRepliesStatus] = useState('idle') // idle | loading | ready | error
  const [totalCount, setTotalCount] = useState(0)
  const [replyCounts, setReplyCounts] = useState({})
  const [confirmDeleteMessage, setConfirmDeleteMessage] = useState(null)

  const hasMore = messages.length < totalCount

  async function fetchBatch(from, to) {
    return supabase
      .from('contact_messages')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)
  }

  // Fetches how many replies exist for a given set of messages and merges
  // the counts into state, keyed by message_id. Counts for messages not
  // covered by `ids` are left untouched.
  async function fetchReplyCounts(ids) {
    if (!ids.length) return
    const { data, error } = await supabase
      .from('message_replies')
      .select('message_id')
      .in('message_id', ids)

    if (error) {
      console.error('Loading reply counts failed:', error)
      return
    }
    const counts = {}
    for (const id of ids) counts[id] = 0
    for (const row of data ?? []) {
      counts[row.message_id] = (counts[row.message_id] ?? 0) + 1
    }
    setReplyCounts((prev) => ({ ...prev, ...counts }))
  }

  async function load() {
    setStatus('loading')
    const { data, error, count } = await fetchBatch(0, PAGE_SIZE - 1)

    if (error) {
      console.error(error)
      setStatus('error')
      return
    }
    setMessages(data ?? [])
    setTotalCount(count ?? 0)
    setStatus('ready')
    fetchReplyCounts((data ?? []).map((m) => m.id))
  }

  // Fetches the next batch and appends it, rather than replacing what's
  // already on screen.
  async function loadMore() {
    setLoadingMore(true)
    const from = messages.length
    const { data, error, count } = await fetchBatch(from, from + PAGE_SIZE - 1)

    setLoadingMore(false)
    if (error) {
      console.error(error)
      alert("Couldn't load more messages.")
      return
    }
    setMessages((prev) => [...prev, ...(data ?? [])])
    setTotalCount(count ?? 0)
    fetchReplyCounts((data ?? []).map((m) => m.id))
  }

  // Re-fetches from the top — same number of messages currently loaded, so
  // new arrivals show up without collapsing back to just the first batch.
  async function refresh() {
    setRefreshing(true)
    const { data, error, count } = await fetchBatch(0, Math.max(messages.length, PAGE_SIZE) - 1)

    setRefreshing(false)
    if (error) {
      console.error(error)
      alert("Couldn't refresh messages.")
      return
    }
    setMessages(data ?? [])
    setTotalCount(count ?? 0)
    fetchReplyCounts((data ?? []).map((m) => m.id))
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!activeMessage) {
      setReplies([])
      setRepliesStatus('idle')
      return
    }
    let cancelled = false
    setRepliesStatus('loading')
    supabase
      .from('message_replies')
      .select('*')
      .eq('message_id', activeMessage.id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error(error)
          setRepliesStatus('error')
          return
        }
        setReplies(data ?? [])
        setRepliesStatus('ready')
      })
    return () => {
      cancelled = true
    }
  }, [activeMessage])

  async function handleDelete(message) {
    setConfirmDeleteMessage(message)
  }

  async function performDelete() {
    const message = confirmDeleteMessage
    if (!message) return
    setDeletingId(message.id)
    const { error } = await supabase.from('contact_messages').delete().eq('id', message.id)
    setDeletingId(null)
    if (error) {
      alert(`Couldn't delete: ${error.message}`)
      return
    }
    setConfirmDeleteMessage(null)
    if (activeMessage?.id === message.id) setActiveMessage(null)
    // Remove locally rather than re-fetching — keeps the rest of the
    // already-loaded batch in place instead of resetting to the first page.
    setMessages((prev) => prev.filter((m) => m.id !== message.id))
    setTotalCount((prev) => Math.max(0, prev - 1))
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
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

        <button
          type="button"
          onClick={refresh}
          disabled={refreshing || status === 'loading'}
          className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-canvas px-4 py-2 text-[13px] font-medium text-ink-soft transition-colors hover:bg-ink/[0.04] hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} strokeWidth={2} />
          Refresh
        </button>
      </div>

      {status === 'loading' && <p className="text-ink-soft">Loading messages…</p>}
      {status === 'error' && <p className="text-red-600 dark:text-red-400">Couldn't load messages.</p>}

      {status === 'ready' && messages.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-[16px] border border-line glass-panel p-12 text-center">
          <Mail className="h-6 w-6 text-ink-soft" strokeWidth={1.75} />
          <p className="text-ink-soft">No messages yet — enquiries submitted on the site will show up here.</p>
        </div>
      )}

      {status === 'ready' && messages.length > 0 && (
        <>
          {/* Desktop / tablet table */}
          <div className="hidden overflow-hidden rounded-[16px] border border-line glass-panel md:block">
            <table className="w-full table-fixed text-left">
              <colgroup>
                <col className="w-[12%]" />
                <col className="w-[14%]" />
                <col className="w-[13%]" />
                <col className="w-[26%]" />
                <col className="w-[12%]" />
                <col className="w-[8%]" />
                <col className="w-[7%]" />
                <col className="w-[8%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-line bg-ink/[0.02]">
                  <th className="px-4 py-3 text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">Name</th>
                  <th className="px-4 py-3 text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">Email Address</th>
                  <th className="px-4 py-3 text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">Phone</th>
                  <th className="px-4 py-3 text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">Message</th>
                  <th className="px-4 py-3 text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">Replies</th>
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
                      <span className="block truncate font-medium text-ink">{message.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="block truncate text-[13px] text-ink-soft">{message.email}</span>
                    </td>
                    <td className="px-4 py-3">
                      {message.phone ? (
                        <span className="block truncate text-[13px] text-ink-soft">{message.phone}</span>
                      ) : (
                        <span className="text-[13px] text-ink-soft/50">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="line-clamp-2 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-soft">
                        {message.message}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <ReplyBadge count={replyCounts[message.id] ?? 0} />
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
                          className="shrink-0 rounded-full p-2 text-ink-soft transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
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
                className="cursor-pointer rounded-[16px] border border-line glass-panel p-5"
              >
                <div className="flex items-center justify-between gap-4">
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
                    className="shrink-0 rounded-full p-2 text-ink-soft transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                  >
                    {deletingId === message.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                    ) : (
                      <Trash2 className="h-4 w-4" strokeWidth={2} />
                    )}
                  </button>
                </div>
                <div className="mt-2 min-w-0">
                  <p className="font-medium text-ink">{message.name}</p>
                  <p className="text-[13px] text-ink-soft">{message.email}</p>
                  {message.phone && (
                    <p className="text-[13px] text-ink-soft">{message.phone}</p>
                  )}
                </div>
                <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-[14px] leading-relaxed text-ink-soft">
                  {message.message}
                </p>
                <div className="mt-3">
                  <ReplyBadge count={replyCounts[message.id] ?? 0} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col items-center gap-3">
            <p className="text-[13px] text-ink-soft">
              Showing {messages.length} of {totalCount} message{totalCount === 1 ? '' : 's'}
            </p>
            {hasMore && (
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 rounded-full border border-line bg-canvas px-5 py-2.5 text-[13px] font-medium text-ink-soft transition-colors hover:bg-ink/[0.04] hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingMore && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            )}
          </div>
        </>
      )}

      <MessageModal
        message={activeMessage}
        onClose={() => setActiveMessage(null)}
        replies={replies}
        repliesStatus={repliesStatus}
        onReplySent={(reply) => {
          setReplies((prev) => [...prev, reply])
          setReplyCounts((prev) => ({
            ...prev,
            [reply.message_id]: (prev[reply.message_id] ?? 0) + 1,
          }))
        }}
      />

      <DeleteConfirmModal
        message={confirmDeleteMessage}
        onCancel={() => setConfirmDeleteMessage(null)}
        onConfirm={performDelete}
        deleting={deletingId === confirmDeleteMessage?.id}
      />
    </div>
  )
}
