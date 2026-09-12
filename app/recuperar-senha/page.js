'use client'
import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '../../lib/supabase/client'

export default function RecuperarSenha(){
  const [email,setEmail]=useState('')
  const [msg,setMsg]=useState('')
  const [sent,setSent]=useState(false)

  async function submit(e){
    e.preventDefault()
    setMsg('Enviando...')
    const supabase=createClient()
    const redirectTo=`${window.location.origin}/auth/callback?next=/nova-senha`
    const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo})
    if(error){setMsg('Não foi possível enviar o e-mail de recuperação. Tente novamente.');return}
    setSent(true)
    setMsg('')
  }

  return <main className="login"><section className="panel loginPanel">
    <h1>Recuperar senha</h1>
    <p>Informe o e-mail do usuário administrativo. Você receberá um link seguro para criar uma nova senha.</p>
    {sent?<>
      <div className="successBox">E-mail de recuperação enviado. Verifique também a caixa de spam. O link é temporário.</div>
      <Link className="goldBtn" href="/login">Voltar ao login</Link>
    </>:<form onSubmit={submit}>
      <label>E-mail<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"/></label>
      <button>Enviar link de recuperação</button>
      <small>{msg}</small>
    </form>}
    <Link className="forgotLink" href="/login">← Voltar ao login</Link>
  </section></main>
}
