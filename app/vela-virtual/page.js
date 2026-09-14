import Header from '../../components/Header'
import Footer from '../../components/Footer'
import VirtualCandleChapel from '../../components/VirtualCandleChapel'
import {createClient} from '../../lib/supabase/server'
export const dynamic='force-dynamic'
export default async function Page(){
 const s=await createClient();const [{data:candles=[]},{data:stats=[]}]=await Promise.all([s.rpc('get_public_virtual_candles',{p_limit:36}),s.rpc('get_virtual_candle_stats')])
 return <><Header/><main className="candlePage"><div className="wrap"><div className="pageHero centered candleHero"><span className="eyebrow">UM ESPAÇO DE ORAÇÃO</span><h1>Vela Virtual de São José</h1><p>Acenda uma vela, confie sua intenção à intercessão de São José e una sua oração às de nossa comunidade.</p></div><VirtualCandleChapel initialCandles={candles||[]} initialStats={stats?.[0]||{}}/><section className="candlePrayer"><span>✝</span><div><h2>Oração a São José</h2><p>Glorioso São José, guardião da Sagrada Família, acolhei nossas preces. Ensinai-nos a confiar em Deus, a servir com humildade e a perseverar na esperança. Rogai por nossas famílias e por todas as intenções aqui apresentadas. Amém.</p></div></section></div></main><Footer/></>
}
