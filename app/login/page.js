'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'

export default function Login(){const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [msg,setMsg]=useState('');const router=useRouter();async function submit(e){e.preventDefault();setMsg('Entrando...');const s=createClient();const {error}=await s.auth.signInWithPassword({email,password});if(error){setMsg('Não foi possível entrar: '+error.message);return}router.push('/admin');router.refresh()}return <main className="login"><form onSubmit={submit} className="panel"><h1>Painel Administrativo</h1><p>Paróquia São José – Umarizal</p><label>E-mail<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Senha<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label><button>Entrar</button><small>{msg}</small></form></main>}
