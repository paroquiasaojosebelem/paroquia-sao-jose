'use client'
import {useMemo,useState} from 'react'
import {createClient} from '../../../lib/supabase/client'

const pad=n=>String(n).padStart(2,'0')
function datesFor(month,weekday){
  const d=new Date(`${month.slice(0,7)}-01T12:00:00`),y=d.getFullYear(),m=d.getMonth(),out=[]
  for(let day=1;day<=new Date(y,m+1,0).getDate();day++){
    const x=new Date(y,m,day,12)
    if(x.getDay()===weekday)out.push(`${y}-${pad(m+1)}-${pad(day)}`)
  }
  return out
}
const fmt=s=>new Intl.DateTimeFormat('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'}).format(new Date(`${s}T12:00:00`))

function firstWeekdayOfMonth(date,weekday){
  const y=date.getFullYear(),m=date.getMonth()
  for(let d=1;d<=7;d++){const x=new Date(y,m,d,12);if(x.getDay()===weekday)return d}
  return null
}
function specialGroup(massDate,ms){
  const [y,m,d]=String(massDate).split('-').map(Number)
  const dt=new Date(y,m-1,d,12),w=dt.getDay(),time=String(ms.mass_time||'').slice(0,5)
  if(w===3&&time==='19:00')return 'ECC'
  if(w===5&&d===firstWeekdayOfMonth(dt,5)&&time==='18:30')return 'APOSTOLADO DA ORAÇÃO'
  if(w===6&&d===firstWeekdayOfMonth(dt,6)&&time==='12:00')return 'LEGIÃO DE MARIA'
  if(w===6&&d===firstWeekdayOfMonth(dt,6)&&time==='19:00')return 'MÃES QUE ORAM PELOS FILHOS'
  return null
}

export default function AvailabilityForm({token,data}){
  const existing=new Set((data.choices||[]).map(c=>`${c.mass_schedule_id}|${c.mass_date}`))
  const [selected,setSelected]=useState(existing)
  const [msg,setMsg]=useState('')
  const [saving,setSaving]=useState(false)

  const items=useMemo(()=>{
    const arr=[]
    for(const ms of data.schedules||[]){
      for(const date of datesFor(data.month,Number(ms.weekday))){
        if(specialGroup(date,ms))continue
        arr.push({ms,date,key:`${ms.id}|${date}`})
      }
    }
    return arr.sort((a,b)=>a.date.localeCompare(b.date)||String(a.ms.mass_time).localeCompare(String(b.ms.mass_time)))
  },[data])

  function toggle(k){setSelected(prev=>{const n=new Set(prev);n.has(k)?n.delete(k):n.add(k);return n})}

  async function save(){
    setSaving(true);setMsg('')
    const choices=items.filter(i=>selected.has(i.key)).map(i=>({mass_schedule_id:i.ms.id,mass_date:i.date}))
    const s=createClient()
    const {data:ok,error}=await s.rpc('save_liturgy_availability',{p_token:token,p_choices:choices})
    setSaving(false)
    setMsg(!error&&ok?'Disponibilidade enviada com sucesso. Obrigado!':'Não foi possível salvar. O prazo pode ter encerrado.')
  }

  return <>
    <div className="availabilityMeta">
      <div><small>Mês</small><b>{new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(new Date(`${data.month.slice(0,7)}-01T12:00:00`))}</b></div>
      <div><small>Prazo</small><b>{data.response_deadline?new Intl.DateTimeFormat('pt-BR').format(new Date(`${data.response_deadline}T12:00:00`)):'Não informado'}</b></div>
    </div>
    <p className="sourceNote">Os horários já assumidos por grupos pastorais não aparecem nesta lista.</p>
    <div className="availabilityList">
      {items.map(({ms,date,key})=><label className={selected.has(key)?'availabilityOption selected':'availabilityOption'} key={key}>
        <input type="checkbox" checked={selected.has(key)} onChange={()=>toggle(key)}/>
        <span><b>{fmt(date)} · {ms.mass_time?.slice(0,5)}</b><small>{ms.title}{ms.notes?` — ${ms.notes}`:''}</small></span>
      </label>)}
    </div>
    <button className="goldBtn availabilitySave" disabled={saving||data.status!=='collecting'} onClick={save}>{saving?'Salvando...':'Enviar minha disponibilidade'}</button>
    {msg&&<div className={msg.includes('sucesso')?'successBox':'errorBox'}>{msg}</div>}
    {data.submitted_at&&<p className="sourceNote">Você já respondeu anteriormente. Pode alterar as opções e enviar novamente enquanto o período estiver aberto.</p>}
  </>
}
