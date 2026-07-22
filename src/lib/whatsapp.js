// TODO: replace if the WhatsApp Business number ever changes (country code, no + or spaces)
export const WHATSAPP_NUMBER = '2348086407680'

export function buildWhatsAppLink(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}
