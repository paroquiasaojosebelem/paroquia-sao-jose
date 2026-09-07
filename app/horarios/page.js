import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { createClient } from '../../lib/supabase/server'
const dias=['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado']
export default async function Horarios(){const s=await createClient();const {data=[]}=await s.from('mass_schedule').select('*').eq('active',true).order('weekday').order('mass_time');return <><Header/><main className="wrap page"><h1>Horários das Santas Missas</h1><div className="panel">{dias.map((dia,i)=>{const xs=data.filter(x=>x.weekday===i);return xs.length?<div className="row" key={i}><span>{dia}</span><b>{xs.map(x=>x.mass_time.slice(0,5).replace(':','h')).join(' | ')}</b></div>:null})}</div></main><Footer/></>}
