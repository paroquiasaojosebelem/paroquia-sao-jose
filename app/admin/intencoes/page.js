import {revalidatePath} from 'next/cache'
import {requireAdmin} from '../../../lib/auth'

async function update(fd){
  'use server'
  const {supabase}=await requireAdmin()
  const paymentStatus=fd.get('payment_status')
  const payload={status:fd.get('status'),active:fd.get('status')!=='arquivada',payment_status:paymentStatus,paid_at:paymentStatus==='pago'?new Date().toISOString():null}
  await supabase.from('intentions').update(payload).eq('id',fd.get('id'))
  revalidatePath('/admin/intencoes')
}
async function remove(fd){'use server';const {supabase}=await requireAdmin();await supabase.from('intentions').delete().eq('id',fd.get('id'));revalidatePath('/admin/intencoes')}

const methodLabel={pix:'PIX',credit:'Crédito',debit:'Débito'}
export default async function Page(){
  const {supabase}=await requireAdmin()
  const {data=[]}=await supabase.from('intentions').select('*').order('created_at',{ascending:false})
  return <><div className="adminTitle"><h1>Intenções</h1><p>Confira os pedidos enviados pelos fiéis, pagamentos e atendimento.</p></div><div className="adminTableWrap"><table className="adminTable"><thead><tr><th>Solicitante</th><th>Tipo</th><th>Intenção</th><th>Data/Missa</th><th>Pagamento</th><th>Status</th><th>Ações</th></tr></thead><tbody>{data.map(x=><tr key={x.id}>
    <td><b>{x.requester_name||'-'}</b><small>{x.requester_phone||''}</small></td>
    <td>{x.intention_type||x.type||'-'}</td>
    <td>{x.intention_text||x.description||'-'}</td>
    <td>{x.mass_date||'-'} {x.mass_time?.slice?.(0,5)||''}</td>
    <td><b>{methodLabel[x.payment_method]||'-'}</b><small>{x.amount!=null?Number(x.amount).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}):''}</small><span className={`status ${x.payment_status==='pago'?'on':''}`}>{x.payment_status||'pendente'}</span></td>
    <td>{x.status||'recebida'}</td>
    <td><div className="actions"><form action={update}><input type="hidden" name="id" value={x.id}/><select name="status" defaultValue={x.status||'recebida'}><option>recebida</option><option>confirmada</option><option>celebrada</option><option>arquivada</option></select><select name="payment_status" defaultValue={x.payment_status||'pendente'}><option value="pendente">pagamento pendente</option><option value="pago">pago</option><option value="isento">isento</option><option value="cancelado">cancelado</option></select><button>Salvar</button></form><form action={remove}><input type="hidden" name="id" value={x.id}/><button className="danger">Excluir</button></form></div></td>
  </tr>)}</tbody></table></div></>
}
