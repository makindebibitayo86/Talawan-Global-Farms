import { useEffect, useState } from 'react'
import {
  Loader2,
  RefreshCw,
  Mail,
  Send,
  AlertCircle,
  CheckCircle2,
  Users,
  History,
  XCircle,
  X,
  Plus,
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

const PAGE_SIZE = 10

// Confirmation step before a campaign actually goes out — sending real
// email to real subscribers isn't undoable, so this mirrors the delete
// confirm pattern in MailTab rather than firing straight from the form.
// Renders on top of the compose modal (which stays mounted underneath),
// so the admin sees their draft blurred behind the confirmation.
function SendConfirmModal({ open, recipientCount, subject, onCancel, onConfirm, sending }) {
  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={sending ? undefined : onCancel}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-[20px] border border-line glass-modal shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-7 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
            <Send className="h-5 w-5 text-primary" strokeWidth={2} />
          </div>
          <h3 className="mb-2 text-[16px] font-semibold text-ink">Send this campaign?</h3>
          <p className="text-[13px] leading-relaxed text-ink-soft">
            "<span className="font-medium text-ink">{subject}</span>" will go out to{' '}
            <span className="font-medium text-ink">{recipientCount}</span> subscriber
            {recipientCount === 1 ? '' : 's'}. This can't be undone.
          </p>
        </div>
        <div className="flex border-t border-line">
          <button
            type="button"
            onClick={onCancel}
            disabled={sending}
            className="flex-1 py-3.5 text-[13px] font-medium uppercase tracking-[0.08em] text-ink-soft transition-colors hover:bg-ink/[0.04] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={sending}
            className="flex flex-1 items-center justify-center gap-2 border-l border-line py-3.5 text-[13px] font-medium uppercase tracking-[0.08em] text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
            {sending ? 'Sending' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Detail view for a single sent campaign — full subject/message (the list
// view truncates both), exact timestamp, and the actual recipient emails
// broken out by whether the send to them succeeded or failed. Campaigns
// sent before recipient-level tracking was added won't have sent_emails /
// failed_emails populated even though the counts are non-zero, so that
// case is called out explicitly rather than just showing an empty list.
function CampaignDetailModal({ campaign, onClose }) {
  useEffect(() => {
    if (!campaign) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [campaign])

  if (!campaign) return null

  const sentEmails = campaign.sent_emails ?? []
  const failedEmails = campaign.failed_emails ?? []
  const hasRecipientDetail = sentEmails.length > 0 || failedEmails.length > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-[20px] border border-line glass-modal shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line p-6">
          <div className="min-w-0">
            <h3 className="truncate text-[16px] font-semibold text-ink">{campaign.subject}</h3>
            <p className="mt-1 text-[12px] text-ink-soft">{formatDateTime(campaign.created_at)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-ink-soft transition-colors hover:bg-ink/[0.06] hover:text-ink"
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-2">
          {/* Message */}
          <div className="overflow-y-auto border-b border-line p-6 md:border-b-0 md:border-r">
            <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">Message</p>
            <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-ink">{campaign.message}</p>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-[12px]">
              <span className="flex items-center gap-1 text-ink-soft">
                <Users className="h-3.5 w-3.5" strokeWidth={2} />
                {campaign.recipient_count} recipient{campaign.recipient_count === 1 ? '' : 's'}
              </span>
              <span className="flex items-center gap-1 text-primary">
                <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                {campaign.sent_count} sent
              </span>
              {campaign.failed_count > 0 && (
                <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                  <XCircle className="h-3.5 w-3.5" strokeWidth={2} />
                  {campaign.failed_count} failed
                </span>
              )}
            </div>
          </div>

          {/* Recipients */}
          <div className="overflow-y-auto p-6">
            <p className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
              <Users className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
              Recipients
            </p>

            {!hasRecipientDetail && (
              <p className="mt-3 rounded-[12px] border border-dashed border-line p-4 text-[13px] text-ink-soft">
                This campaign was sent before individual recipients were recorded, so only the counts on the left
                are available for it.
              </p>
            )}

            {sentEmails.length > 0 && (
              <div className="mt-3">
                <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
                  Sent to ({sentEmails.length})
                </p>
                <ul className="mt-2 max-h-52 space-y-1 overflow-y-auto rounded-[12px] border border-line bg-canvas-alt/40 p-3">
                  {sentEmails.map((email) => (
                    <li key={email} className="truncate text-[13px] text-ink">
                      {email}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {failedEmails.length > 0 && (
              <div className="mt-5">
                <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
                  Failed ({failedEmails.length})
                </p>
                <ul className="mt-2 max-h-52 space-y-1 overflow-y-auto rounded-[12px] border border-red-200 bg-red-50 p-3 dark:border-red-900/40 dark:bg-red-950/20">
                  {failedEmails.map((email) => (
                    <li key={email} className="truncate text-[13px] text-red-700 dark:text-red-400">
                      {email}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// The full "create a campaign" flow lives in this modal: pick recipients
// from the subscriber list, then write the subject/message. Submitting
// hands off to SendConfirmModal, which renders stacked on top of this one
// (this modal stays mounted underneath, so the draft is still visible,
// blurred, behind the confirmation).
function ComposeModal({
  open,
  onClose,
  subscribers,
  totalCount,
  hasMore,
  loadingMore,
  onLoadMore,
  selectedIds,
  selectAllMatching,
  onToggleOne,
  onToggleSelectPage,
  onSelectAllMatching,
  allPageSelected,
  subject,
  onSubjectChange,
  message,
  onMessageChange,
  recipientCount,
  sendStatus,
  sendResult,
  sendError,
  onSubmit,
}) {
  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open) return null

  const sending = sendStatus === 'sending'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={sending ? undefined : onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[20px] border border-line glass-modal shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line p-6">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-px w-5 bg-primary" />
              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
                New campaign
              </span>
            </div>
            <h3 className="text-[18px] font-semibold text-ink">Create newsletter</h3>
          </div>
          <button
            type="button"
            onClick={sending ? undefined : onClose}
            disabled={sending}
            className="shrink-0 rounded-full p-1.5 text-ink-soft transition-colors hover:bg-ink/[0.06] hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-2">
            {/* Recipients */}
            <div className="flex flex-col overflow-hidden border-b border-line p-6 md:border-b-0 md:border-r">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.1em] text-ink-soft">
                  <Users className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
                  Recipients
                </h4>
                <label className="flex items-center gap-2 text-[12px] text-ink-soft">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={onToggleSelectPage}
                    disabled={sending}
                    className="h-3.5 w-3.5 accent-primary"
                  />
                  Select loaded ({subscribers.length})
                </label>
              </div>

              <div className="flex-1 overflow-y-auto rounded-[14px] border border-line md:min-h-0">
                {subscribers.length === 0 ? (
                  <p className="p-4 text-[13px] text-ink-soft">No subscribers yet.</p>
                ) : (
                  subscribers.map((subscriber) => (
                    <label
                      key={subscriber.id}
                      className="flex cursor-pointer items-center gap-3 border-b border-line px-4 py-2.5 last:border-b-0 hover:bg-ink/[0.03]"
                    >
                      <input
                        type="checkbox"
                        checked={selectAllMatching || selectedIds.has(subscriber.id)}
                        onChange={() => onToggleOne(subscriber.id)}
                        disabled={sending || selectAllMatching}
                        className="h-4 w-4 shrink-0 accent-primary"
                      />
                      <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{subscriber.email}</span>
                      <span className="shrink-0 text-[11px] text-ink-soft">
                        {formatDate(subscriber.created_at)}
                      </span>
                    </label>
                  ))
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[12px] text-ink-soft">
                  {recipientCount > 0
                    ? `${selectAllMatching ? `All ${totalCount}` : recipientCount} of ${totalCount} subscriber${
                        totalCount === 1 ? '' : 's'
                      } selected`
                    : `${totalCount} subscriber${totalCount === 1 ? '' : 's'} total`}
                </p>
                <div className="flex items-center gap-3">
                  {hasMore && (
                    <button
                      type="button"
                      onClick={onLoadMore}
                      disabled={loadingMore || sending}
                      className="flex items-center gap-1.5 text-[12px] font-medium text-ink-soft transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loadingMore && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />}
                      {loadingMore ? 'Loading…' : 'Load more'}
                    </button>
                  )}
                  {!selectAllMatching && totalCount > subscribers.length && selectedIds.size > 0 && (
                    <button
                      type="button"
                      onClick={onSelectAllMatching}
                      disabled={sending}
                      className="text-[12px] font-medium text-primary transition-colors hover:text-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Select all {totalCount} instead
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="flex flex-col space-y-4 overflow-y-auto p-6">
              <h4 className="flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.1em] text-ink-soft">
                <Mail className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
                Message
              </h4>

              <div>
                <label htmlFor="campaign-subject" className="text-[12px] font-medium text-ink-soft">
                  Subject
                </label>
                <input
                  id="campaign-subject"
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => onSubjectChange(e.target.value)}
                  placeholder="New harvest now available"
                  disabled={sending}
                  className="mt-2 w-full rounded-sm border border-line bg-canvas-alt/60 px-4 py-3 text-ink outline-none transition focus:border-primary focus:bg-canvas focus:ring-4 focus:ring-primary/10 disabled:opacity-60"
                />
              </div>

              <div className="flex flex-1 flex-col">
                <label htmlFor="campaign-message" className="text-[12px] font-medium text-ink-soft">
                  Message
                </label>
                <textarea
                  id="campaign-message"
                  required
                  rows={6}
                  value={message}
                  onChange={(e) => onMessageChange(e.target.value)}
                  placeholder="Let your subscribers know what's new…"
                  disabled={sending}
                  className="mt-2 w-full flex-1 resize-y rounded-sm border border-line bg-canvas-alt/60 px-4 py-3 text-ink outline-none transition focus:border-primary focus:bg-canvas focus:ring-4 focus:ring-primary/10 disabled:opacity-60"
                />
              </div>

              {sendStatus === 'success' && sendResult && (
                <p className="flex items-center gap-2 text-sm font-medium text-primary">
                  <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  Sent to {sendResult.sent} of {sendResult.total} subscriber{sendResult.total === 1 ? '' : 's'}
                  {sendResult.failed > 0 ? ` — ${sendResult.failed} failed.` : '.'}
                </p>
              )}
              {sendStatus === 'error' && (
                <p className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  {sendError}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-line p-6">
            <p className="text-[12px] text-ink-soft">
              {recipientCount > 0
                ? `Sending to ${selectAllMatching ? `all ${totalCount}` : recipientCount} subscriber${
                    recipientCount === 1 ? '' : 's'
                  }`
                : 'Select at least one recipient'}
            </p>
            <button
              type="submit"
              disabled={sending || !subject.trim() || !message.trim() || recipientCount === 0}
              className="flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-[13px] font-medium uppercase tracking-[0.08em] text-canvas transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Send className="h-4 w-4" strokeWidth={2} />
              Review & send
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminNewsletter() {
  const [subscribers, setSubscribers] = useState([])
  const [status, setStatus] = useState('loading')
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)

  // Two selection modes: specific row ids (bounded by what's loaded), or
  // "every subscriber that matches" once the admin explicitly opts into
  // that beyond the current page. Selection lives here (not inside the
  // modal) so a draft in progress survives closing and reopening it.
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [selectAllMatching, setSelectAllMatching] = useState(false)

  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [composeOpen, setComposeOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sendStatus, setSendStatus] = useState('idle') // idle | sending | success | error
  const [sendResult, setSendResult] = useState(null)
  const [sendError, setSendError] = useState('')

  // Sent-campaign history, shown in its own column alongside subscribers.
  // Paginated the same way as subscribers — newest campaigns first (already
  // the sort order below), with a "Load more" button to fetch older ones.
  const [campaigns, setCampaigns] = useState([])
  const [campaignsStatus, setCampaignsStatus] = useState('loading')
  const [campaignsTotalCount, setCampaignsTotalCount] = useState(0)
  const [loadingMoreCampaigns, setLoadingMoreCampaigns] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState(null)

  const hasMore = subscribers.length < totalCount
  const hasMoreCampaigns = campaigns.length < campaignsTotalCount
  const recipientCount = selectAllMatching ? totalCount : selectedIds.size

  async function fetchBatch(from, to) {
    return supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)
  }

  async function load() {
    setStatus('loading')
    const { data, error, count } = await fetchBatch(0, PAGE_SIZE - 1)
    if (error) {
      console.error(error)
      setStatus('error')
      return
    }
    setSubscribers(data ?? [])
    setTotalCount(count ?? 0)
    setStatus('ready')
  }

  async function loadMore() {
    setLoadingMore(true)
    const from = subscribers.length
    const { data, error, count } = await fetchBatch(from, from + PAGE_SIZE - 1)
    setLoadingMore(false)
    if (error) {
      console.error(error)
      alert("Couldn't load more subscribers.")
      return
    }
    setSubscribers((prev) => [...prev, ...(data ?? [])])
    setTotalCount(count ?? 0)
  }

  // Re-fetches from the top — same number of subscribers currently loaded,
  // so new signups show up without collapsing back to just the first batch.
  async function refresh() {
    setRefreshing(true)
    const { data, error, count } = await fetchBatch(0, Math.max(subscribers.length, PAGE_SIZE) - 1)
    setRefreshing(false)
    if (error) {
      console.error(error)
      alert("Couldn't refresh subscribers.")
      return
    }
    setSubscribers(data ?? [])
    setTotalCount(count ?? 0)
  }

  async function fetchCampaignsBatch(from, to) {
    return supabase
      .from('newsletter_campaigns')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)
  }

  async function loadCampaigns() {
    setCampaignsStatus('loading')
    const { data, error, count } = await fetchCampaignsBatch(0, PAGE_SIZE - 1)
    if (error) {
      console.error(error)
      setCampaignsStatus('error')
      return
    }
    setCampaigns(data ?? [])
    setCampaignsTotalCount(count ?? 0)
    setCampaignsStatus('ready')
  }

  async function loadMoreCampaigns() {
    setLoadingMoreCampaigns(true)
    const from = campaigns.length
    const { data, error, count } = await fetchCampaignsBatch(from, from + PAGE_SIZE - 1)
    setLoadingMoreCampaigns(false)
    if (error) {
      console.error(error)
      alert("Couldn't load more campaigns.")
      return
    }
    setCampaigns((prev) => [...prev, ...(data ?? [])])
    setCampaignsTotalCount(count ?? 0)
  }

  useEffect(() => {
    load()
    loadCampaigns()
  }, [])

  function toggleOne(id) {
    setSelectAllMatching(false)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectPage() {
    setSelectAllMatching(false)
    const pageIds = subscribers.map((s) => s.id)
    const allPageSelected = pageIds.every((id) => selectedIds.has(id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allPageSelected) {
        pageIds.forEach((id) => next.delete(id))
      } else {
        pageIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  function handleSendClick(e) {
    e.preventDefault()
    if (!subject.trim() || !message.trim() || recipientCount === 0) return
    setSendStatus('idle')
    setConfirmOpen(true)
  }

  async function handleConfirmSend() {
    setSendStatus('sending')
    setSendError('')
    try {
      const { data, error } = await supabase.functions.invoke('newsletter-campaign', {
        body: {
          subject: subject.trim(),
          message: message.trim(),
          recipientIds: selectAllMatching ? 'all' : Array.from(selectedIds),
        },
      })
      if (error) throw error

      setSendResult(data)
      setSendStatus('success')
      setConfirmOpen(false)
      setSubject('')
      setMessage('')
      setSelectedIds(new Set())
      setSelectAllMatching(false)
      loadCampaigns()
      setComposeOpen(false)
    } catch (err) {
      console.error('Campaign send failed:', err)
      setSendStatus('error')
      setSendError(err.message || 'Failed to send campaign.')
    }
  }

  const pageIds = subscribers.map((s) => s.id)
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id))

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-px w-6 bg-primary" />
            <span className="text-[12px] font-medium uppercase tracking-[0.18em] text-primary">Newsletter</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-ink">Subscribers & campaigns.</h1>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => {
              refresh()
              loadCampaigns()
            }}
            disabled={refreshing || status === 'loading'}
            className="flex items-center gap-2 rounded-full border border-line bg-canvas px-4 py-2 text-[13px] font-medium text-ink-soft transition-colors hover:bg-ink/[0.04] hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} strokeWidth={2} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              setSendStatus('idle')
              setComposeOpen(true)
            }}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-[13px] font-medium uppercase tracking-[0.08em] text-canvas transition-colors hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Create newsletter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        {/* Left column: subscriber list (view-only — selection happens in the modal) */}
        <div className="min-w-0">
          {status === 'loading' && <p className="text-ink-soft">Loading subscribers…</p>}
          {status === 'error' && <p className="text-red-600 dark:text-red-400">Couldn't load subscribers.</p>}

          {status === 'ready' && subscribers.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-[16px] border border-line glass-panel p-12 text-center">
              <Mail className="h-6 w-6 text-ink-soft" strokeWidth={1.75} />
              <p className="text-ink-soft">No subscribers yet — signups from the newsletter form will show up here.</p>
            </div>
          )}

          {status === 'ready' && subscribers.length > 0 && (
            <>
              {/* Desktop / tablet table */}
              <div className="hidden overflow-hidden rounded-[16px] border border-line glass-panel md:block">
                <table className="w-full table-fixed text-left">
                  <colgroup>
                    <col className="w-[68%]" />
                    <col className="w-[32%]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-line bg-ink/[0.02]">
                      <th className="px-4 py-3 text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
                        Email Address
                      </th>
                      <th className="px-4 py-3 text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
                        Subscribed
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map((subscriber) => (
                      <tr
                        key={subscriber.id}
                        className="border-b border-line transition-colors last:border-b-0 hover:bg-ink/[0.03]"
                      >
                        <td className="px-4 py-3">
                          <span className="block truncate text-[14px] text-ink">{subscriber.email}</span>
                        </td>
                        <td className="px-4 py-3 text-[13px] text-ink-soft">{formatDate(subscriber.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="space-y-3 md:hidden">
                {subscribers.map((subscriber) => (
                  <div
                    key={subscriber.id}
                    className="flex items-center gap-3 rounded-[16px] border border-line glass-panel p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink">{subscriber.email}</p>
                      <p className="text-[12px] text-ink-soft">Subscribed {formatDate(subscriber.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-col items-center gap-3">
                <p className="text-[13px] text-ink-soft">
                  Showing {subscribers.length} of {totalCount} subscriber{totalCount === 1 ? '' : 's'}
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
        </div>

        {/* Right column: sent campaign history */}
        <div className="min-w-0 rounded-[16px] border border-line glass-panel p-6">
          <div className="mb-5 flex items-center gap-2 text-ink">
            <History className="h-4 w-4 text-primary" strokeWidth={2} />
            <h2 className="font-medium">Sent messages</h2>
          </div>

          {campaignsStatus === 'loading' && <p className="text-ink-soft">Loading campaign history…</p>}
          {campaignsStatus === 'error' && (
            <p className="text-red-600 dark:text-red-400">Couldn't load campaign history.</p>
          )}

          {campaignsStatus === 'ready' && campaigns.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-[16px] border border-dashed border-line p-10 text-center">
              <Send className="h-6 w-6 text-ink-soft" strokeWidth={1.75} />
              <p className="text-ink-soft">No campaigns sent yet — sent messages will show up here.</p>
            </div>
          )}

          {campaignsStatus === 'ready' && campaigns.length > 0 && (
            <>
              <div className="max-h-[720px] space-y-3 overflow-y-auto pr-1">
                {campaigns.map((campaign) => (
                  <button
                    key={campaign.id}
                    type="button"
                    onClick={() => setSelectedCampaign(campaign)}
                    className="w-full rounded-[14px] border border-line bg-canvas-alt/40 p-4 text-left transition-colors hover:bg-ink/[0.03]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 truncate font-medium text-ink">{campaign.subject}</p>
                      <span className="shrink-0 text-[12px] text-ink-soft">{formatDateTime(campaign.created_at)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[13px] text-ink-soft">{campaign.message}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px]">
                      <span className="flex items-center gap-1 text-ink-soft">
                        <Users className="h-3.5 w-3.5" strokeWidth={2} />
                        {campaign.recipient_count} recipient{campaign.recipient_count === 1 ? '' : 's'}
                      </span>
                      <span className="flex items-center gap-1 text-primary">
                        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                        {campaign.sent_count} sent
                      </span>
                      {campaign.failed_count > 0 && (
                        <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                          <XCircle className="h-3.5 w-3.5" strokeWidth={2} />
                          {campaign.failed_count} failed
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-5 flex flex-col items-center gap-3">
                <p className="text-[13px] text-ink-soft">
                  Showing {campaigns.length} of {campaignsTotalCount} campaign{campaignsTotalCount === 1 ? '' : 's'}
                </p>
                {hasMoreCampaigns && (
                  <button
                    type="button"
                    onClick={loadMoreCampaigns}
                    disabled={loadingMoreCampaigns}
                    className="flex items-center gap-2 rounded-full border border-line bg-canvas px-5 py-2.5 text-[13px] font-medium text-ink-soft transition-colors hover:bg-ink/[0.04] hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loadingMoreCampaigns && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
                    {loadingMoreCampaigns ? 'Loading…' : 'Load more'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <ComposeModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        subscribers={subscribers}
        totalCount={totalCount}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={loadMore}
        selectedIds={selectedIds}
        selectAllMatching={selectAllMatching}
        onToggleOne={toggleOne}
        onToggleSelectPage={toggleSelectPage}
        onSelectAllMatching={() => setSelectAllMatching(true)}
        allPageSelected={allPageSelected}
        subject={subject}
        onSubjectChange={setSubject}
        message={message}
        onMessageChange={setMessage}
        recipientCount={recipientCount}
        sendStatus={sendStatus}
        sendResult={sendResult}
        sendError={sendError}
        onSubmit={handleSendClick}
      />

      <SendConfirmModal
        open={confirmOpen}
        recipientCount={recipientCount}
        subject={subject}
        sending={sendStatus === 'sending'}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmSend}
      />

      <CampaignDetailModal campaign={selectedCampaign} onClose={() => setSelectedCampaign(null)} />
    </div>
  )
}
