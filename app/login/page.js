'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'

export default function Login(){
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [msg,setMsg]=useState('')
  const [senhaAlterada,setSenhaAlterada]=useState(false)
  const router=useRouter()

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search)
    setSenhaAlterada(params.get('senha')==='alterada')
    if(params.get('erro')==='recuperacao') setMsg('O link de recuperação é inválido ou expirou. Solicite um novo link.')
  },[])

  async function submit(e){
    e.preventDefault()
    setMsg('Entrando...')
    const s=createClient()
    const {error}=await s.auth.signInWithPassword({email,password})
    if(error){setMsg('Não foi possível entrar. Confira o e-mail e a senha.');return}
    router.push('/admin')
    router.refresh()
  }

  return <main className="login"><form onSubmit={submit} className="panel loginPanel">
    <h1>Painel Administrativo</h1><p>Paróquia São José – Umarizal</p>
    {senhaAlterada&&<div className="successBox">Senha alterada com sucesso. Entre com sua nova senha.</div>}
    <label>E-mail<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"/></label>
    <label>Senha<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password"/></label>
    <button>Entrar</button>
    <Link className="forgotLink" href="/recuperar-senha">Esqueci minha senha</Link>
    <small>{msg}</small>
  </form></main>
}
