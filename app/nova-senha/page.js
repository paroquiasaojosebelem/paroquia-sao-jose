'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'

export default function NovaSenha(){
  const [password,setPassword]=useState('')
  const [confirm,setConfirm]=useState('')
  const [msg,setMsg]=useState('')
  const router=useRouter()

  async function submit(e){
    e.preventDefault()
    if(password.length<8){setMsg('Use uma senha com pelo menos 8 caracteres.');return}
    if(password!==confirm){setMsg('As senhas não coincidem.');return}
    setMsg('Salvando nova senha...')
    const supabase=createClient()
    const {error}=await supabase.auth.updateUser({password})
    if(error){setMsg('O link pode ter expirado. Solicite um novo e-mail de recuperação.');return}
    await supabase.auth.signOut()
    router.replace('/login?senha=alterada')
    router.refresh()
  }

  return <main className="login"><form onSubmit={submit} className="panel loginPanel">
    <h1>Criar nova senha</h1>
    <p>Defina uma nova senha para o painel administrativo da Paróquia.</p>
    <label>Nova senha<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} autoComplete="new-password"/></label>
    <label>Confirmar nova senha<input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required minLength={8} autoComplete="new-password"/></label>
    <button>Salvar nova senha</button>
    <small>{msg}</small>
  </form></main>
}
