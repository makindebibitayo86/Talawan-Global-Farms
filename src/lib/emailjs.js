import emailjs from '@emailjs/browser'

// Set these in a .env file at the project root (Vite exposes anything
// prefixed with VITE_ to client code). Get the values from your EmailJS
// dashboard: Service ID (Email Services), Template ID (Email Templates),
// and Public Key (Account > General).
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

// Separate template for admin replies (sent out to the enquirer, rather
// than in from the contact form). Set this up in the EmailJS dashboard as
// its own template — see sendReplyToEnquirer below for what it needs.
const REPLY_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_REPLY_TEMPLATE_ID

// Sends a contact form submission through EmailJS.
// `params` should have { name, email, phone, message } — these map to the
// {{name}}, {{email}}, {{phone}}, {{message}} variables in the EmailJS
// template. phone is optional, so it's sent as an empty string when left
// blank — add a {{phone}} variable to your EmailJS template if you want
// it to show up in the email (it'll just be blank when not provided).
export function sendContactMessage({ name, email, phone, message }) {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    return Promise.reject(
      new Error(
        'EmailJS is not configured. Set VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, and VITE_EMAILJS_PUBLIC_KEY in your .env file.'
      )
    )
  }

  return emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    {
      name,
      email,
      phone: phone || '',
      message,
    },
    { publicKey: PUBLIC_KEY }
  )
}

// Sends the admin's reply to the enquirer's email address, from the
// brand's own EmailJS-connected inbox — not a mailto: link.
//
// One-time setup needed in the EmailJS dashboard:
// 1. Create a new template (Email Templates > Create New Template).
// 2. Set "To Email" on the template to {{to_email}}.
// 3. Use {{to_name}}, {{to_email}}, and {{reply_message}} in the body —
//    e.g. "Hi {{to_name}}, ... {{reply_message}} ... Talawan Global Farms".
// 4. Copy its Template ID into VITE_EMAILJS_REPLY_TEMPLATE_ID in .env.
export function sendReplyToEnquirer({ toName, toEmail, replyMessage }) {
  if (!SERVICE_ID || !REPLY_TEMPLATE_ID || !PUBLIC_KEY) {
    return Promise.reject(
      new Error(
        'Reply email is not configured. Set VITE_EMAILJS_REPLY_TEMPLATE_ID (alongside the existing VITE_EMAILJS_SERVICE_ID and VITE_EMAILJS_PUBLIC_KEY) in your .env file.'
      )
    )
  }

  return emailjs.send(
    SERVICE_ID,
    REPLY_TEMPLATE_ID,
    {
      to_name: toName,
      to_email: toEmail,
      reply_message: replyMessage,
    },
    { publicKey: PUBLIC_KEY }
  )
}
