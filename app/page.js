import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { createClient } from '../lib/supabase/server'
const dias=['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado']
const hh=t=>t?.slice(0,5) || ''
export default async function Home(){
 const s=await createClient();
 const [{data:masses=[]},{data:live=[]},{data:news=[]}]=await Promise.all([
  s.from('mass_schedule').select('weekday,mass_time,title,notes').eq('active',true).order('weekday').order('mass_time'),
  s.from('live_streams').select('*').eq('active',true).order('starts_at',{ascending:false}).limit(1),
  s.from('news').select('id,title,summary,published_at,active').eq('active',true).order('published_at',{ascending:false}).limit(3)
 ]);
 const grouped=masses.reduce((a,m)=>{(a[m.weekday]??=[]).push(m);return a},{}); const currentLive=live?.[0];
 return <><Header/>
  <section className="hero"><div className="wrap heroGrid"><div className="heroText"><span className="eyebrow">PARÓQUIA SÃO JOSÉ · UMARIZAL</span><h2>A exemplo de São José,<br/>caminhemos na fé, no serviço<br/>e na esperança.</h2><p>“Ele fez como o Anjo do Senhor lhe havia mandado.” <em>(Mt 1,24)</em></p><Link className="goldBtn" href="/pastorais">CONHEÇA NOSSA PARÓQUIA →</Link></div></div></section>
  <section className="shortcutBand"><div className="wrap shortcuts">
   <Link href="/pastorais"><span>♟</span><b>PASTORAIS</b><small>Servir é evangelizar</small></Link>
   <Link href="/horarios"><span>◷</span><b>HORÁRIOS</b><small>Missas e Confissões</small></Link>
   <Link href="/liturgia"><span>†</span><b>LITURGIA DIÁRIA</b><small>A Palavra de hoje</small></Link>
   <Link href="/terco-virtual"><span>◉</span><b>TERÇO VIRTUAL</b><small>Reze conosco</small></Link>
   <Link href="/dizimo"><span>♥</span><b>DÍZIMO</b><small>Partilhe esta obra</small></Link>
   <Link href="/intencoes"><span>◇</span><b>INTENÇÕES</b><small>Apresente sua intenção</small></Link>
   <Link href="/noticias"><span>▤</span><b>NOTÍCIAS</b><small>Fique por dentro</small></Link>
  </div></section>
  <section className="wrap welcomeSection"><div className="welcomeCard"><div><span className="eyebrow dark">PARÓQUIA SÃO JOSÉ – UMARIZAL</span><h2>Bem-vindo à<br/>Paróquia São José</h2><h3>Uma comunidade de fé, acolhida e serviço.</h3><p>Aqui, pessoas se encontram, vidas são transformadas e o amor de Deus se faz presente no dia a dia, por meio da Palavra, da Eucaristia e da vida comunitária.</p><Link className="goldBtn" href="/pastorais">SAIBA MAIS →</Link></div><div className="saintArt"><div className="saintPlaceholder">SÃO JOSÉ<br/><small>Padroeiro da família e da Igreja</small></div></div></div>
   <div className="quickStack"><Link href="/horarios"><span>♛</span><div><b>Santas Missas</b><small>Confira os horários das celebrações</small></div>›</Link><Link href="/horarios"><span>🙏</span><div><b>Confissões</b><small>Encontre um tempo para a reconciliação</small></div>›</Link><Link href="/pastorais"><span>👥</span><div><b>Pastorais</b><small>Descubra como participar</small></div>›</Link><Link href="/transmissao"><span>🔴</span><div><b>Transmissão ao Vivo</b><small>{currentLive?'Celebração disponível':'Acompanhe as celebrações'}</small></div>›</Link></div>
  </section>
  <section className="scheduleBand"><div className="wrap scheduleGrid"><div className="joseBlock"><h2>SÃO JOSÉ</h2><p>PADROEIRO DA FAMÍLIA<br/>E DA IGREJA</p><em>“Com São José, aprendemos a ouvir, obedecer e servir a Deus.”</em></div><div className="scheduleBox"><h3>◷ Horários</h3>{Object.entries(grouped).slice(0,7).map(([d,items])=><div className="miniRow" key={d}><span>{dias[d]?.replace('-feira','')}</span><b>{items.map(x=>hh(x.mass_time)+(x.notes?.toLowerCase().includes('shopping')?'*':'')).join(' | ')}</b></div>)}<Link href="/horarios">VER TODOS OS HORÁRIOS</Link></div><div className="scheduleBox"><h3>🙏 Confissões</h3><p><b>Quinta-feira</b><br/>15h00 às 17h30</p><p><b>Sexta-feira</b><br/>15h00 às 17h30</p><p><b>Sábado</b><br/>09h00 às 11h30</p><small>Outros dias mediante agendamento.</small></div><div className="scheduleBox"><h3>▦ Secretaria</h3><p><b>Segunda a Sexta</b><br/>08h00–12h00<br/>14h00–18h00</p><p><b>Sábado</b><br/>08h00–12h00</p><p>☎ (91) 98284-3192</p></div><div className="actionRail"><Link className="green" href="/liturgia">📖 <b>LITURGIA DIÁRIA</b><small>A Palavra de Deus hoje</small></Link><Link className="red" href="/dizimo">♥ <b>DÍZIMO</b><small>Partilhe esta obra</small></Link><Link className="brown" href="/intencoes">🙏 <b>INTENÇÕES</b><small>Apresente sua intenção</small></Link><Link className="blue" href="/pastorais">👥 <b>PASTORAIS</b><small>Faça parte desta missão</small></Link></div></div></section>
  {news.length>0&&<section className="wrap newsPreview"><div className="sectionHead"><div><span className="eyebrow dark">COMUNIDADE</span><h2>Últimas notícias</h2></div><Link href="/noticias">Ver todas →</Link></div><div className="newsGrid">{news.map(n=><article className="newsCard" key={n.id}><small>{n.published_at?new Date(n.published_at).toLocaleDateString('pt-BR'):''}</small><h3>{n.title}</h3><p>{n.summary}</p></article>)}</div></section>}
  <Footer/><a className="float" href="https://wa.me/5591982843192" aria-label="WhatsApp">☏</a>
 </>
}
