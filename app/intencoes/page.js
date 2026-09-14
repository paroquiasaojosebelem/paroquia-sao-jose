import Header from '../../components/Header'
import Footer from '../../components/Footer'
import {createClient} from '../../lib/supabase/server'
import {redirect} from 'next/navigation'
import IntentionForm from '../../components/IntentionForm'

const tipos=['Saúde e cura','Aniversários e bodas','Ação de graças','Intenções particulares','Sétimo dia','Aniversário']
const metodos=[['pix','PIX'],['credit','Cartão de crédito'],['debit','Cartão de débito']]

async function enviar(formData){
  'use server'
  const s=await createClient()
  const {data:cfg}=await s.from('donation_settings').select('intention_amount').eq('active',true).limit(1).maybeSingle()
  const id=crypto.randomUUID()
  const method=String(formData.get('payment_method')||'pix')
  const amount=cfg?.intention_amount ? Number(cfg.intention_amount) : null
  const payload={
    id,
    requester_name:formData.get('requester_name')?.trim(),
    requester_phone:formData.get('requester_phone')?.trim()||null,
    intention_type:formData.get('intention_type'),
    intention_text:formData.get('intention_text')?.trim(),
    mass_date:formData.get('mass_date')||null,
    mass_time:formData.get('mass_time')||null,
    status:'recebida',active:true,
    payment_method:method,
    payment_status:'pendente',
    amount
  }
  const {error}=await s.from('intentions').insert(payload)
  if(error)redirect('/intencoes?erro=1')
  redirect(`/intencoes/pagamento?protocolo=${encodeURIComponent(id)}&metodo=${encodeURIComponent(method)}`)
}

export default async function Intencoes({searchParams}){
  const sp=await searchParams
  const s=await createClient()
  const [{data:cfg},{data:schedule=[]}]=await Promise.all([s.from('donation_settings').select('intention_amount').eq('active',true).limit(1).maybeSingle(),s.from('mass_schedule').select('id,weekday,mass_time,notes').eq('active',true).order('weekday').order('mass_time')])
  const valor=cfg?.intention_amount ? Number(cfg.intention_amount).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) : 'a definir pela Secretaria'
  return <><Header/><main className="wrap page">
    <div className="pageHero centered"><span className="eyebrow dark">SANTA MISSA</span><h1>Intenções</h1><p>Apresente à comunidade sua intenção para ser lembrada na celebração.</p></div>
    {sp?.erro&&<div className="errorBox">Não foi possível enviar agora. Entre em contato com a Secretaria.</div>}
    <div className="twoCols">
      <section className="panel"><h2>Tipos de intenção</h2>{tipos.map(t=><div className="intentionType" key={t}><b>✦ {t}</b><p>{t==='Saúde e cura'?'Pedidos de recuperação e conforto para enfermos.':t==='Aniversários e bodas'?'Celebração da vida, matrimônio ou ordenação.':t==='Ação de graças'?'Agradecimento por graças alcançadas, trabalho, batizados e outras bênçãos.':'Apresente os nomes e a intenção que deseja confiar à Santa Missa.'}</p></div>)}</section>
      <IntentionForm action={enviar} tipos={tipos} metodos={metodos} schedule={schedule||[]} valor={valor}/>
    </div>
  </main><Footer/></>
}
