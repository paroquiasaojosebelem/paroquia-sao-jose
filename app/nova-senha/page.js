'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'

export default function NovaSenha(){
  const [password,setPassword]=useState('')
  const [confirm,setConfirm]=useState('')
  const [msg,setMsg]=useState('Validando link de recuperação...')
  const [ready,setReady]=useState(false)
  const [invalid,setInvalid]=useState(false)
  const router=useRouter()

  useEffect(()=>{
    let mounted=true
    const supabase=createClient()

    async function validateRecovery(){
      try{
        const params=new URLSearchParams(window.location.search)
        const code=params.get('code')

        // Fluxo PKCE do Supabase: o retorno pode vir com ?code=...
        if(code){
          const {error}=await supabase.auth.exchangeCodeForSession(code)
          if(error) throw error

          window.history.replaceState({}, document.title, '/nova-senha')
          if(mounted){
            setReady(true)
            setInvalid(false)
            setMsg('')
          }
          return
        }

        // Em alguns fluxos, o Supabase já entrega a sessão de recuperação.
        const {data:{session},error}=await supabase.auth.getSession()
        if(error) throw error

        if(session){
          if(mounted){
            setReady(true)
            setInvalid(false)
            setMsg('')
          }
          return
        }

        if(mounted){
          setInvalid(true)
          setReady(false)
          setMsg('O link de recuperação é inválido ou expirou. Solicite um novo link.')
        }
      }catch(error){
        console.error('Erro ao validar recuperação:', error)
        if(mounted){
          setInvalid(true)
          setReady(false)
          setMsg('Não foi possível validar o link de recuperação. Solicite um novo link.')
        }
      }
    }

    validateRecovery()

    const {data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{
      if((event==='PASSWORD_RECOVERY' || event==='SIGNED_IN') && session && mounted){
        setReady(true)
        setInvalid(false)
        setMsg('')
      }
    })

    return ()=>{
      mounted=false
      subscription?.unsubscribe()
    }
  },[])

  async function submit(e){
    e.preventDefault()

    if(!ready){
      setMsg('O link de recuperação ainda não foi validado.')
      return
    }
    if(password.length<8){
      setMsg('Use uma senha com pelo menos 8 caracteres.')
      return
    }
    if(password!==confirm){
      setMsg('As senhas não coincidem.')
      return
    }

    setMsg('Salvando nova senha...')
    const supabase=createClient()
    const {error}=await supabase.auth.updateUser({password})

    if(error){
      console.error('Erro ao alterar senha:', error)
      setMsg('Não foi possível alterar a senha. Solicite um novo link de recuperação.')
      return
    }

    await supabase.auth.signOut()
    router.replace('/login?senha=alterada')
    router.refresh()
  }

  return <main className="login"><section className="panel loginPanel">
    <h1>Criar nova senha</h1>
    <p>Defina uma nova senha para o painel administrativo da Paróquia.</p>

    {invalid ? <>
      <div className="errorBox">{msg}</div>
      <Link className="goldBtn" href="/recuperar-senha">Solicitar novo link</Link>
      <Link className="forgotLink" href="/login">← Voltar ao login</Link>
    </> : <>
      {!ready && <div className="successBox">{msg}</div>}
      {ready && <form onSubmit={submit}>
        <label>Nova senha
          <input
            type="password"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </label>
        <label>Confirmar nova senha
          <input
            type="password"
            value={confirm}
            onChange={e=>setConfirm(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </label>
        <button>Salvar nova senha</button>
        <small>{msg}</small>
      </form>}
    </>}
  </section></main>
}
