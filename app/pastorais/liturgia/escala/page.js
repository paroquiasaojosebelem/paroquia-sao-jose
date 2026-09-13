import Header from '../../../../components/Header'
import Footer from '../../../../components/Footer'
import {createClient} from '../../../../lib/supabase/server'

const roles={commentator:'Comentarista',first_reading:'1ª Leitura',second_reading:'2ª Leitura',psalmist:'Salmista'}
const fmt=s=>new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'2-digit',month:'long'}).format(new Date(`${s}T12:00:00`))
function one(v){return Array.isArray(v)?(v[0]||null):(v||null)}
function firstWeekdayOfMonth(date,weekday){const y=date.getFullYear(),m=date.getMonth();for(let d=1;d<=7;d++){const x=new Date(y,m,d,12);if(x.getDay()===weekday)return d}return null}
function specialGroup(massDate,ms){
  const [y,m,d]=String(massDate||'').slice(0,10).split('-').map(Number)
  if(!y||!m||!d)return null
  const dt=new Date(y,m-1,d,12),w=dt.getDay(),time=String(ms?.mass_time||'').slice(0,5)
  if(w===3&&time==='19:00')return 'ECC'
  if(w===5&&d===firstWeekdayOfMonth(dt,5)&&time==='18:30')return 'APOSTOLADO DA ORAÇÃO'
  if(w===6&&d===firstWeekdayOfMonth(dt,6)&&time==='12:00')return 'LEGIÃO DE MARIA'
  if(w===6&&d===firstWeekdayOfMonth(dt,6)&&time==='19:00')return 'MÃES QUE ORAM PELOS FILHOS'
  return null
}

export default async function Page(){
  const s=await createClient()
  const {data:cycles}=await s.from('liturgy_availability_cycles').select('*').eq('status','published').order('month',{ascending:false}).limit(1)
  const cycle=Array.isArray(cycles)?cycles[0]:null
  let rows=[]
  if(cycle){
    const q=await s.from('liturgy_assignments').select('*,liturgy_members(name),mass_schedule(title,mass_time,weekday)').eq('cycle_id',cycle.id).order('mass_date')
    rows=q.data||[]
  }
  const grouped={}
  for(const a of rows){const key=`${a.mass_date}|${a.mass_schedule_id}`;(grouped[key]??=[]).push(a)}

  return <><Header/><main className="wrap page">
    <div className="pageHero centered"><span className="eyebrow dark">PASTORAL DA LITURGIA</span><h1>Escala Litúrgica</h1><p>Serviço de comentaristas, leitores e salmistas nas celebrações da comunidade.</p></div>
    {!cycle?<div className="panel centered"><h2>Escala em preparação</h2><p>A próxima escala será publicada aqui assim que for concluída pela coordenação.</p></div>:<>
      <div className="panel schedulePublicHeader"><h2>{new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(new Date(`${cycle.month.slice(0,7)}-01T12:00:00`))}</h2><p>Em caso de impossibilidade, procure a coordenação da Pastoral da Liturgia com antecedência.</p><p className="sourceNote">Algumas celebrações possuem responsabilidade fixa de grupos pastorais.</p></div>
      <div className="publicScheduleGrid">{Object.entries(grouped).map(([key,items])=>{
        const x=items[0], ms=one(x.mass_schedule), group=specialGroup(x.mass_date,ms)
        return <article className="publicScheduleCard" key={key}>
          <h3>{fmt(x.mass_date)}</h3>
          <p className="massTitle">{ms?.mass_time?.slice(0,5)} — {ms?.title}</p>
          {group
            ?<div className="publicAssignment"><span>Responsabilidade</span><b>{group}</b></div>
            :items.map(a=><div className="publicAssignment" key={a.id}><span>{roles[a.role]}</span><b>{one(a.liturgy_members)?.name||'Vaga em aberto'}</b></div>)}
        </article>
      })}</div>
    </>}
  </main><Footer/></>
}
