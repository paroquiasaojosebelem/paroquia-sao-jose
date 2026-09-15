'use client'
import {useMemo,useState} from 'react'
import {createClient} from '../lib/supabase/client'

const TYPES=['Família','Saúde','Trabalho','Falecidos','Ação de graças','Pedido especial']
function softBell(){
  try{
    const C=window.AudioContext||window.webkitAudioContext;if(!C)return
    const ctx=new C(),now=ctx.currentTime
    ;[523.25,659.25,783.99].forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.045/(i+1),now+.02);g.gain.exponentialRampToValueAtTime(.0001,now+1.35);o.connect(g);g.connect(ctx.destination);o.start(now);o.stop(now+1.4)})
  }catch{}
}
export default function VirtualCandleChapel({initialCandles=[],initialStats={}}){
 const [candles,setCandles]=useState(initialCandles),[stats,setStats]=useState(initialStats),[open,setOpen]=useState(false),[selected,setSelected]=useState(null),[saving,setSaving]=useState(false),[done,setDone]=useState(false),[error,setError]=useState('')
 const positions=useMemo(()=>candles.map((c,i)=>({left:6+((i*23)%88),bottom:5+((i*17)%29),scale:.72+((i*7)%25)/100,delay:-((i*13)%37)/10})),[candles])
 async function refresh(){const s=createClient();const [{data:c},{data:st}]=await Promise.all([s.rpc('get_public_virtual_candles',{p_limit:36}),s.rpc('get_virtual_candle_stats')]);if(c)setCandles(c);if(st?.[0])setStats(st[0])}
 async function submit(e){e.preventDefault();setSaving(true);setError('');const fd=new FormData(e.currentTarget);const s=createClient();const {error:er}=await s.rpc('light_virtual_candle',{p_name:String(fd.get('name')||'').trim()||null,p_intention_type:fd.get('type'),p_message:String(fd.get('message')||'').trim()||null,p_is_public:fd.get('public')==='on'});setSaving(false);if(er){setError('Não foi possível acender a vela. Tente novamente.');return}softBell();setDone(true);await refresh()}
 function close(){setOpen(false);setDone(false);setError('')}
 return <>
  <section className="candleStats"><div><strong>{stats.total||0}</strong><span>velas acesas neste momento</span></div><div><b>{stats.familia||0}</b><span>Família</span></div><div><b>{stats.saude||0}</b><span>Saúde</span></div><div><b>{stats.acao_gracas||0}</b><span>Ação de graças</span></div></section>
  <section className="chapelScene" aria-label="Capela Virtual de São José">
    <div className="chapelBackdrop"/><div className="chapelGlow"/>
    <div className="chapelArch"><div className="chapelCross">✝</div><div className="saintFigure" aria-label="São José"><div className="saintHalo"/><div className="saintHead"/><div className="saintBody"/><div className="saintChild"/><div className="saintLily">⚜</div><strong>SÃO JOSÉ</strong><small>rogai por nós</small></div></div>
    <div className="altarTop"><span>Paróquia São José · Umarizal</span></div>
    <div className="candleShelf">
      {candles.map((c,i)=><button type="button" className="virtualCandle" key={c.id} style={{left:`${positions[i].left}%`,bottom:`${positions[i].bottom}%`,transform:`scale(${positions[i].scale})`}} onClick={()=>setSelected(c)} aria-label={`Abrir ${c.display_name}`}><i className="flame" style={{animationDelay:`${positions[i].delay}s`}}/><i className="wick"/><i className="wax"/></button>)}
      {!candles.length&&<div className="emptyChapel"><span>🕯️</span><b>A primeira vela pode ser a sua.</b><small>Una sua oração à nossa comunidade.</small></div>}
    </div>
    <button className="lightCandleBtn" onClick={()=>setOpen(true)}>🕯️ ACENDER MINHA VELA</button>
  </section>
  <p className="candlePrivacy">As velas permanecem acesas simbolicamente por 7 dias. Acender uma vela é gratuito. Intenções marcadas como privadas nunca são exibidas publicamente.</p>

  {selected&&<div className="candleModal" onClick={()=>setSelected(null)}><article onClick={e=>e.stopPropagation()}><button className="modalClose" onClick={()=>setSelected(null)}>×</button><div className="modalFlame">🕯️</div><small>{selected.intention_type}</small><h2>{selected.display_name}</h2>{selected.display_message&&<p>“{selected.display_message}”</p>}<em>São José, rogai por nós.</em></article></div>}
  {open&&<div className="candleModal"><article className="candleFormModal"><button className="modalClose" onClick={close}>×</button>{done?<div className="candleSuccess"><div>🕯️</div><h2>Sua vela foi acesa.</h2><p>Que São José apresente sua intenção a Deus.</p><p>Ela permanecerá acesa durante <b>7 dias</b>.</p><button onClick={close}>VOLTAR À CAPELA</button></div>:<><small>VELA VIRTUAL DE SÃO JOSÉ</small><h2>Acenda sua vela</h2><p>Confie sua intenção à intercessão de São José e una sua oração às de nossa comunidade.</p><form onSubmit={submit} className="candleForm"><label>Seu primeiro nome <small>(opcional)</small><input name="name" maxLength="80" placeholder="Ex.: Maria"/></label><label>Por qual intenção você deseja rezar?<select name="type" defaultValue="Família">{TYPES.map(t=><option key={t}>{t}</option>)}</select></label><label>Sua intenção <small>(opcional · até 250 caracteres)</small><textarea name="message" maxLength="250" rows="4" placeholder="Escreva uma oração ou intenção breve..."/></label><label className="candleCheck"><input type="checkbox" name="public"/><span>Permitir que meu nome e minha intenção sejam vistos ao clicar na vela.</span></label><div className="privacyNote">Se não marcar esta opção, sua vela continuará visível, mas aparecerá apenas como <b>“Uma intenção particular”</b>.</div>{error&&<div className="errorBox">{error}</div>}<button disabled={saving}>{saving?'ACENDENDO...':'🕯️ ACENDER MINHA VELA'}</button></form></>}</article></div>}
 </>
}
