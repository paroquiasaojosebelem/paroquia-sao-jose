'use client'
import {useMemo,useState} from 'react'

const typeHints={
  'Saúde e cura':'Informe o nome da pessoa e o pedido de saúde, cura ou conforto.',
  'Aniversários e bodas':'Informe o(s) nome(s) e o motivo da celebração (aniversário, bodas ou ordenação).',
  'Ação de graças':'Informe o nome e a graça pela qual deseja agradecer.',
  'Intenções particulares':'Informe os nomes e a intenção que deseja confiar à Santa Missa.',
  'Sétimo dia':'Informe o nome da pessoa falecida e, se desejar, uma breve observação.',
  'Aniversário':'Informe o nome da pessoa e o aniversário que será celebrado.'
}
export default function IntentionForm({action,tipos,metodos,schedule,valor}){
  const [date,setDate]=useState(''); const [type,setType]=useState('');
  const weekday=useMemo(()=>date?new Date(date+'T12:00:00').getDay():null,[date])
  const masses=useMemo(()=>weekday===null?[]:schedule.filter(x=>Number(x.weekday)===weekday),[weekday,schedule])
  return <form action={action} className="panel formCard"><h2>Enviar uma intenção</h2>
    <label>Seu nome<input name="requester_name" required/></label>
    <label>WhatsApp / telefone<input name="requester_phone" required/></label>
    <label>Tipo<select name="intention_type" required value={type} onChange={e=>setType(e.target.value)}><option value="" disabled>Selecione</option>{tipos.map(t=><option key={t}>{t}</option>)}</select></label>
    <label>Intenção<textarea name="intention_text" rows="5" required placeholder={typeHints[type]||'Informe o nome da pessoa e a intenção da missa.'}/></label>
    <div className="formRow"><label>Data desejada<input type="date" name="mass_date" required value={date} onChange={e=>setDate(e.target.value)}/></label>
      <label>Santa Missa<select name="mass_time" required defaultValue="" key={date||'none'} disabled={!date}><option value="" disabled>{!date?'Escolha primeiro a data':masses.length?'Selecione o horário':'Não há missa cadastrada'}</option>{masses.map(x=><option key={x.id} value={x.mass_time?.slice(0,5)}>{x.mass_time?.slice(0,5)}{x.notes?` — ${x.notes}`:''}</option>)}</select></label></div>
    {date&&masses.length===0&&<small className="formHint">Não há Santa Missa cadastrada para esta data. Escolha outra data ou consulte a Secretaria.</small>}
    <div className="offerNotice"><b>Oferta da intenção:</b> {valor}</div>
    <label>Forma de pagamento<select name="payment_method" required defaultValue="pix">{metodos.map(([v,n])=><option key={v} value={v}>{n}</option>)}</select></label>
    <button className="goldBtn" disabled={!!date&&!masses.length}>ENVIAR INTENÇÃO E CONTINUAR PARA PAGAMENTO</button>
    <small>A intenção será conferida pela Secretaria. Dados de cartão não são armazenados no site da Paróquia.</small>
  </form>
}
