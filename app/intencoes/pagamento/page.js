import Link from 'next/link'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import CopyPixButton from '../../../components/CopyPixButton'
import {createClient} from '../../../lib/supabase/server'

const labels={pix:'PIX',credit:'Cartão de crédito',debit:'Cartão de débito'}
export default async function Pagamento({searchParams}){
  const sp=await searchParams
  const method=sp?.metodo || 'pix'
  const protocolo=sp?.protocolo || ''
  const s=await createClient()
  const {data:cfg}=await s.from('donation_settings').select('*').eq('active',true).limit(1).maybeSingle()
  const amount=cfg?.intention_amount ? Number(cfg.intention_amount).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) : null
  const pix=cfg?.intention_pix_key || cfg?.pix_key || ''
  const qr=cfg?.intention_pix_qr_url || cfg?.pix_qr_url || ''
  const cardUrl=cfg?.intention_card_payment_url || cfg?.card_payment_url || ''
  const isCard=method==='credit'||method==='debit'

  return <><Header/><main className="wrap page paymentPage">
    <div className="pageHero centered"><span className="eyebrow dark">INTENÇÃO REGISTRADA</span><h1>Concluir pagamento</h1><p>Sua intenção foi recebida. Finalize a oferta pela forma escolhida.</p></div>
    <section className="panel paymentCard">
      <div className="paymentSummary"><div><small>Forma escolhida</small><b>{labels[method]||'PIX'}</b></div><div><small>Valor</small><b>{amount||'A confirmar'}</b></div></div>
      {method==='pix'&&<div className="paymentMethodBox"><h2>Pagamento por PIX</h2>{pix?<><p>Use a chave abaixo no aplicativo do seu banco:</p><div className="pixKey"><b>{pix}</b></div><CopyPixButton value={pix}/>{qr&&<img className="qr" src={qr} alt="QR Code PIX da Paróquia"/>}</>:<div className="errorBox">A chave PIX das intenções ainda precisa ser cadastrada pela Secretaria.</div>}</div>}
      {isCard&&<div className="paymentMethodBox"><h2>{labels[method]}</h2>{cardUrl?<><p>O pagamento será concluído no ambiente seguro do provedor da Paróquia. Nenhum número de cartão é armazenado neste site.</p><a className="goldBtn" href={cardUrl} target="_blank" rel="noreferrer">ABRIR PAGAMENTO SEGURO</a></>:<div className="errorBox">O link para pagamento com cartão ainda precisa ser configurado pela Secretaria.</div>}</div>}
      <div className="paymentProtocol"><small>Protocolo da intenção</small><code>{protocolo}</code><p>Guarde este protocolo até a confirmação da Secretaria.</p></div>
      <div className="paymentNotice">Após o pagamento, a Secretaria confere a identificação e marca a intenção como <b>paga</b> no painel administrativo.</div>
      <Link className="forgotLink" href="/">Voltar ao site da Paróquia</Link>
    </section>
  </main><Footer/></>
}
