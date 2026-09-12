import {revalidatePath} from 'next/cache'
import {requireAdmin} from '../../../lib/auth'

async function saveDonation(fd){
  'use server'
  const {supabase}=await requireAdmin()
  const amountRaw=String(fd.get('intention_amount')||'').replace(',','.')
  const payload={
    pix_key:fd.get('pix_key')?.trim()||null,
    pix_qr_url:fd.get('pix_qr_url')?.trim()||null,
    card_payment_url:fd.get('card_payment_url')?.trim()||null,
    intention_amount:amountRaw?Number(amountRaw):null,
    intention_pix_key:fd.get('intention_pix_key')?.trim()||null,
    intention_pix_qr_url:fd.get('intention_pix_qr_url')?.trim()||null,
    intention_card_payment_url:fd.get('intention_card_payment_url')?.trim()||null,
    active:true
  }
  const {data}=await supabase.from('donation_settings').select('id').limit(1).maybeSingle()
  if(data?.id)await supabase.from('donation_settings').update(payload).eq('id',data.id);else await supabase.from('donation_settings').insert(payload)
  revalidatePath('/dizimo');revalidatePath('/intencoes');revalidatePath('/intencoes/pagamento');revalidatePath('/admin/configuracoes')
}

export default async function Page(){
  const {supabase}=await requireAdmin()
  const {data:cfg}=await supabase.from('donation_settings').select('*').limit(1).maybeSingle()
  return <><div className="adminTitle"><h1>Configurações</h1><p>Dados institucionais e meios de contribuição.</p></div>
    <section className="panel adminPanel"><h2>Dízimo e contribuições</h2><form action={saveDonation} className="adminForm">
      <h3>Dízimo</h3>
      <label>Chave PIX<input name="pix_key" defaultValue={cfg?.pix_key||''}/></label>
      <label>Imagem / QR Code PIX (URL)<input name="pix_qr_url" defaultValue={cfg?.pix_qr_url||''}/></label>
      <label>Link seguro para cartão de débito/crédito<input name="card_payment_url" defaultValue={cfg?.card_payment_url||''} placeholder="Link do provedor de pagamento"/></label>
      <hr/>
      <h3>Intenções da Santa Missa</h3>
      <label>Valor da intenção (R$)<input type="number" min="0" step="0.01" name="intention_amount" defaultValue={cfg?.intention_amount??''} placeholder="Ex.: 10,00"/></label>
      <label>Chave PIX das intenções<input name="intention_pix_key" defaultValue={cfg?.intention_pix_key||''} placeholder="Se vazio, usa a chave PIX do Dízimo"/></label>
      <label>Imagem / QR Code PIX das intenções (URL)<input name="intention_pix_qr_url" defaultValue={cfg?.intention_pix_qr_url||''} placeholder="Opcional; se vazio, usa o QR do Dízimo"/></label>
      <label>Link seguro para cartão das intenções<input name="intention_card_payment_url" defaultValue={cfg?.intention_card_payment_url||''} placeholder="Mercado Pago, PagBank ou outro provedor"/></label>
      <button>Salvar configurações</button>
    </form><p className="adminHint">O site nunca grava número, validade ou código de segurança de cartão. Cartões são processados exclusivamente no ambiente do provedor de pagamento.</p></section>
  </>
}
