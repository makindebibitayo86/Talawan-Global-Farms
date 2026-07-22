import { motion } from 'framer-motion'
import { buildWhatsAppLink } from '../lib/whatsapp'

// Always visible (unlike ScrollToTopButton, which only appears after
// scrolling) — mount once near the root of the app alongside it.
const whatsappHref = buildWhatsAppLink(
  "Hi Talawan Global Farms, I'd like to make an enquiry."
)

function WhatsAppIcon(props) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" {...props}>
      <path d="M16.004 3C9.096 3 3.5 8.596 3.5 15.504c0 2.4.665 4.71 1.925 6.73L3 29l6.94-2.372a12.9 12.9 0 0 0 6.064 1.542h.005c6.908 0 12.503-5.596 12.503-12.504C28.512 8.758 22.912 3 16.004 3Zm0 22.87h-.004a10.35 10.35 0 0 1-5.28-1.446l-.379-.225-3.977 1.36 1.328-3.878-.246-.397a10.34 10.34 0 0 1-1.586-5.514c0-5.72 4.657-10.377 10.376-10.377 2.77 0 5.375 1.08 7.335 3.041a10.3 10.3 0 0 1 3.038 7.34c0 5.72-4.657 10.377-10.376 10.377Zm5.688-7.77c-.312-.156-1.846-.911-2.132-1.015-.286-.104-.494-.156-.702.156-.208.313-.806 1.015-.988 1.223-.182.208-.364.234-.676.078-.312-.156-1.318-.485-2.51-1.548-.928-.827-1.554-1.85-1.736-2.163-.182-.312-.02-.481.137-.637.14-.14.312-.364.468-.546.156-.182.208-.312.312-.52.104-.208.052-.39-.026-.546-.078-.156-.702-1.69-.962-2.315-.253-.607-.51-.525-.702-.535l-.598-.01a1.147 1.147 0 0 0-.832.39c-.286.312-1.092 1.067-1.092 2.601s1.118 3.017 1.274 3.226c.156.208 2.2 3.359 5.33 4.71.745.322 1.325.514 1.778.658.747.237 1.427.204 1.964.124.599-.09 1.846-.755 2.106-1.484.26-.729.26-1.354.182-1.484-.078-.13-.286-.208-.598-.364Z" />
    </svg>
  )
}

export default function WhatsAppButton() {
  return (
    <motion.a
      href={whatsappHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Enquire on WhatsApp"
      initial={{ opacity: 0, y: 12, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed bottom-6 right-4 z-40 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-lg transition hover:opacity-90 sm:bottom-8 sm:right-6"
    >
      <WhatsAppIcon className="h-5 w-5 shrink-0" />
      <span className="text-sm font-semibold whitespace-nowrap">
        Chat with us!
      </span>
    </motion.a>
  )
}
