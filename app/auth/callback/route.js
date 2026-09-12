import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'

export async function GET(request){
  const {searchParams,origin}=new URL(request.url)
  const code=searchParams.get('code')
  const requestedNext=searchParams.get('next') || '/nova-senha'
  const next=requestedNext.startsWith('/') ? requestedNext : '/nova-senha'

  if(code){
    const supabase=await createClient()
    const {error}=await supabase.auth.exchangeCodeForSession(code)
    if(!error) return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/recuperar-senha?erro=link`)
}
