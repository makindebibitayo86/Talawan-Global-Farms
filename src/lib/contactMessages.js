import { supabase } from './supabaseClient'

// Saves a contact form submission to the contact_messages table.
export async function saveContactMessage({ name, email, message }) {
  const { error } = await supabase
    .from('contact_messages')
    .insert([{ name, email, message }])

  if (error) throw error
}
