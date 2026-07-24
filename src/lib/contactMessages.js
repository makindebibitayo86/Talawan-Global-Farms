import { supabase } from './supabaseClient'

// Saves a contact form submission to the contact_messages table.
// phone is optional — stored as null if the visitor left it blank.
export async function saveContactMessage({ name, email, phone, message }) {
  const { error } = await supabase
    .from('contact_messages')
    .insert([{ name, email, phone: phone || null, message }])

  if (error) throw error
}
