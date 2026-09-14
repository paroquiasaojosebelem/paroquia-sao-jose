'use client'
import {useState} from 'react'
import {createClient} from '../../../lib/supabase/client'

export default function PaymentConfirmationForm({protocol}){
  const [reference,setReference]=useState('')
  const [state,setState]=useState('idle')
  async function submit(e){
    e.preventDefault(); setState('sending')
    const s=createClient()
    const {data,error}=await s.rpc('inform_intention_payment',{p_id:protocol,p_reference:reference||null})
    setState(!error&&data?'ok':'error')
  }
  if(state==='ok') return <div className="successBox"><b>Pagamento informado à Secretaria.</b><br/>A equipe fará a conferência e confirmará a intenção no painel administrativo.</div>
  return <form onSubmit={submit} className="paymentConfirmForm">
    <h3>Já realizou o pagamento?</h3>
    <p>Depois de pagar, avise a Secretaria por aqui. A confirmação final será feita após a conferência.</p>
    <label>Identificação / referência do pagamento (opcional)<input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Ex.: nome do pagador ou identificação do PIX"/></label>
    <button className="goldBtn" disabled={state==='sending'}>{state==='sending'?'ENVIANDO...':'INFORMAR PAGAMENTO REALIZADO'}</button>
    {state==='error'&&<div className="errorBox">Não foi possível registrar a informação agora. Guarde o protocolo e fale com a Secretaria.</div>}
  </form>
}
