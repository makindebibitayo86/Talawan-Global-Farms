import { useEffect, useState } from 'react'
import { Trash2, Loader2, Mail } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function AdminMessages() {
  const [messages, setMessages] = useState([])
  const [status, setStatus] = useState('loading')
  const [deletingId, setDeletingId] = useState(null)

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
    load()
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-semibold text-ink">Messages</h1>

      {status === 'loading' && <p className="text-ink-soft">Loading messages…</p>}
      {status === 'error' && <p className="text-red-600">Couldn't load messages.</p>}

      {status === 'ready' && messages.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-[16px] border border-line bg-canvas p-12 text-center">
          <Mail className="h-6 w-6 text-ink-soft" strokeWidth={1.75} />
          <p className="text-ink-soft">No messages yet — enquiries submitted on the site will show up here.</p>
        </div>
      )}

      {status === 'ready' && messages.length > 0 && (
        <div className="space-y-3">
          {messages.map((message) => (
            <div key={message.id} className="rounded-[16px] border border-line bg-canvas p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{message.name}</p>
                  <a href={`mailto:${message.email}`} className="text-[13px] text-primary hover:underline">
                    {message.email}
                  </a>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-[12px] text-ink-soft/70">{formatDate(message.created_at)}</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(message)}
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
              <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-ink-soft">
                {message.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
