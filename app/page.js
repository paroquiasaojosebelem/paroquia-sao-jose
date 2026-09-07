import Header from '../components/Header'
import Footer from '../components/Footer'
import { createClient } from '../lib/supabase/server'

const dias = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado']
function hh(t){ return t?.slice(0,5).replace(':','h') || '' }

export default async function Home(){
  const supabase = await createClient()
  const { data: masses = [] } = await supabase.from('mass_schedule').select('weekday,mass_time,title,notes').eq('active',true).order('weekday').order('mass_time')
  const grouped = masses.reduce((a,m)=>{(a[m.weekday]??=[]).push(m);return a},{})
  return <>
    <Header/>
    <section className="hero"><div className="wrap heroGrid"><div className="heroText"><h2>Uma comunidade que caminha na fé,<br/><em>com São José, rumo a Cristo.</em></h2><p>“Fazei tudo o que Ele vos disser.” (Jo 2,5)</p></div><aside><div>🏆 Santas Missas</div><div>🙏 Confissões</div><div>☀️ Adoração</div><div>👥 Secretaria</div><a className="wa" href="https://wa.me/5591982843192">💬 FALE CONOSCO NO WHATSAPP<br/><b>(91) 98284-3192</b></a></aside></div></section>
    <section className="wrap cards"><a href="/liturgia">📖<b>Liturgia Diária</b><small>A Palavra de Deus hoje</small></a><a href="/intencoes">✝<b>Intenções</b><small>Peça sua intenção</small></a><a href="/dizimo">♥<b>Dízimo</b><small>Seja um dizimista</small></a><a href="/pastorais">👪<b>Pastorais</b><small>Serviço e missão</small></a><a href="/festividade">🌿<b>Festividade</b><small>São José – Março</small></a></section>
    <section className="wrap homeCols"><div className="panel"><h3>🗓 Horários das Missas</h3>{Object.entries(grouped).map(([d,items])=><div className="row" key={d}><span>{dias[d]}</span><b>{items.map(x=>hh(x.mass_time)).join(' | ')}</b></div>)}</div><div className="panel live"><h3>🔴 Transmissão ao Vivo</h3><p>O painel administrativo terá um módulo para ativar a transmissão oficial pelo YouTube. Quando houver live, o player aparecerá aqui automaticamente.</p><button disabled>Próxima transmissão</button></div><div className="panel festival"><h3>Festividade de São José</h3><p>Todo mês de março: programação, novena, celebrações, notícias e arquivo histórico por ano.</p></div></section>
    <Footer/><a className="float" href="https://wa.me/5591982843192">☏</a>
  </>
}
