import {revalidatePath} from 'next/cache'
import {requireAdmin} from '../../../lib/auth'

async function update(fd){
  'use server'
  const {supabase}=await requireAdmin()
  const paymentStatus=String(fd.get('payment_status')||'pendente')
  const status=String(fd.get('status')||'recebida')
  const now=new Date().toISOString()
  const payload={
    status, active:status!=='cancelada'&&status!=='arquivada', payment_status:paymentStatus,
    paid_at:paymentStatus==='pago'?now:null,
    confirmed_at:status==='confirmada'?now:null,
    celebrated_at:status==='celebrada'?now:null,
    admin_notes:String(fd.get('admin_notes')||'').trim()||null
  }
  await supabase.from('intentions').update(payload).eq('id',fd.get('id'))
  revalidatePath('/admin/intencoes')
}
async function remove(fd){'use server';const {supabase}=await requireAdmin();await supabase.from('intentions').delete().eq('id',fd.get('id'));revalidatePath('/admin/intencoes')}

const methodLabel={pix:'PIX',credit:'Crédito',debit:'Débito'}
const payLabel={pendente:'Aguardando pagamento',informado:'Pagamento informado',pago:'Pago / confirmado',isento:'Isento',cancelado:'Pagamento cancelado'}
const statusLabel={recebida:'Recebida',confirmada:'Confirmada para a Missa',celebrada:'Celebrada',cancelada:'Cancelada',arquivada:'Arquivada'}
const brDate=v=>v?String(v).split('-').reverse().join('/'):'-'

export default async function Page({searchParams}){
  const sp=await searchParams
  const {supabase}=await requireAdmin()
  let q=supabase.from('intentions').select('*').order('mass_date',{ascending:true}).order('mass_time',{ascending:true})
  if(sp?.data)q=q.eq('mass_date',sp.data)
  if(sp?.situacao)q=q.eq('status',sp.situacao)
  if(sp?.pagamento)q=q.eq('payment_status',sp.pagamento)
  const {data=[]}=await q
  const total=data.length, aguardando=data.filter(x=>(x.payment_status||'pendente')==='pendente').length, informados=data.filter(x=>x.payment_status==='informado').length, confirmados=data.filter(x=>x.status==='confirmada').length
  return <><div className="adminTitle"><h1>Intenções da Santa Missa</h1><p>Organize pedidos, pagamentos e a confirmação das intenções por celebração.</p></div>
    <div className="intentionStats"><div><small>EXIBIDAS</small><b>{total}</b></div><div><small>AGUARDANDO PAGAMENTO</small><b>{aguardando}</b></div><div><small>PAGAMENTO INFORMADO</small><b>{informados}</b></div><div><small>CONFIRMADAS</small><b>{confirmados}</b></div></div>
    <form className="intentionFilters" method="get"><label>Data da Missa<input type="date" name="data" defaultValue={sp?.data||''}/></label><label>Situação<select name="situacao" defaultValue={sp?.situacao||''}><option value="">Todas</option>{Object.entries(statusLabel).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label>Pagamento<select name="pagamento" defaultValue={sp?.pagamento||''}><option value="">Todos</option>{Object.entries(payLabel).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><button>Filtrar</button><a href="/admin/intencoes">Limpar</a></form>
    {data.length===0?<div className="panel centered"><h2>Nenhuma intenção encontrada</h2><p>Altere os filtros ou aguarde novos pedidos.</p></div>:<div className="adminTableWrap"><table className="adminTable"><thead><tr><th>Solicitante</th><th>Intenção</th><th>Missa</th><th>Pagamento</th><th>Atendimento</th></tr></thead><tbody>{data.map(x=><tr key={x.id}>
      <td><b>{x.requester_name||'-'}</b><small>{x.requester_phone||''}</small><small>Protocolo: {String(x.id).slice(0,8)}</small></td>
      <td><b>{x.intention_type||'-'}</b><small className="intentionText">{x.intention_text||'-'}</small></td>
      <td><b>{brDate(x.mass_date)}</b><small>{x.mass_time?.slice?.(0,5)||''}</small></td>
      <td><b>{methodLabel[x.payment_method]||'-'} · {x.amount!=null?Number(x.amount).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}):'valor não definido'}</b><span className={`paymentPill ${x.payment_status||'pendente'}`}>{payLabel[x.payment_status||'pendente']}</span>{x.payment_reference&&<small>Ref.: {x.payment_reference}</small>}</td>
      <td><form action={update} className="intentionAction"><input type="hidden" name="id" value={x.id}/><select name="status" defaultValue={x.status||'recebida'}>{Object.entries(statusLabel).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select><select name="payment_status" defaultValue={x.payment_status||'pendente'}>{Object.entries(payLabel).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select><textarea name="admin_notes" rows="2" defaultValue={x.admin_notes||''} placeholder="Observação interna da Secretaria"/><button>Salvar</button></form><form action={remove}><input type="hidden" name="id" value={x.id}/><button className="danger">Excluir</button></form></td>
    </tr>)}</tbody></table></div>}
  </>
}
