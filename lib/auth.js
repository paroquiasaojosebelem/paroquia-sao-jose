import { redirect } from 'next/navigation'
import { createClient } from './supabase/server'

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name,role,active')
    .eq('id', user.id)
    .single()
  if (!profile?.active || !['admin','editor'].includes(profile.role)) redirect('/')
  return { supabase, user, profile }
}
