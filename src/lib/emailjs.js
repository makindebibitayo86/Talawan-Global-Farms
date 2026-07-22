import emailjs from '@emailjs/browser'

// Set these in a .env file at the project root (Vite exposes anything
// prefixed with VITE_ to client code). Get the values from your EmailJS
// dashboard: Service ID (Email Services), Template ID (Email Templates),
// and Public Key (Account > General).
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

// Sends a contact form submission through EmailJS.
// `params` should have { name, email, message } — these map to the
// {{name}}, {{email}}, {{message}} variables in the EmailJS template,
// so make sure the template uses matching variable names.
export function sendContactMessage({ name, email, message }) {
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
      message,
    },
    { publicKey: PUBLIC_KEY }
  )
}
