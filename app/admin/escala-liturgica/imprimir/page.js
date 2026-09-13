import { requireAdmin } from '../../../../lib/auth'
import LiturgyPrintButton from '../../../../components/LiturgyPrintButton'
import './print.css'

const roleOrder=['commentator','first_reading','psalmist','second_reading']
const roleKeys={
  commentator:'commentator',
  first_reading:'first_reading',
  psalmist:'psalmist',
  second_reading:'second_reading'
}
const weekdayNames=['DOMINGO','SEGUNDA','TERÇA','QUARTA','QUINTA','SEXTA','SÁBADO']
const monthNames=['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO','JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO']

function one(v){ return Array.isArray(v)?(v[0]||null):(v||null) }
function isoDate(v){ return String(v||'').slice(0,10) }
function brDate(v){
  const [y,m,d]=isoDate(v).split('-')
  return y&&m&&d?`${d}/${m}/${y}`:''
}
function weekday(v){
  const [y,m,d]=isoDate(v).split('-').map(Number)
  return weekdayNames[new Date(y,m-1,d,12).getDay()]||''
}
function monthTitle(v){
  const [y,m]=isoDate(v).split('-').map(Number)
  return `${monthNames[m-1]||''} / ${y||''}`
}
function timeOf(ms){ return String(ms?.mass_time||'').slice(0,5) }
function appliesSecond(ms){
  const w=Number(ms?.weekday)
  return w===0 || (w===6 && timeOf(ms)==='19:00')
}

function firstWeekdayOfMonth(date, weekday){
  const y=date.getFullYear(), m=date.getMonth()
  for(let d=1;d<=7;d++){
    const x=new Date(y,m,d,12)
    if(x.getDay()===weekday)return d
  }
  return null
}
function specialGroup(massDate, ms){
  const value=String(massDate||'').slice(0,10)
  if(!value||!ms)return null
  const [y,m,d]=value.split('-').map(Number)
  const dt=new Date(y,m-1,d,12)
  const w=dt.getDay()
  const time=String(ms.mass_time||'').slice(0,5)

  if(w===3 && time==='19:00') return 'ECC'
  if(w===5 && d===firstWeekdayOfMonth(dt,5) && time==='18:30') return 'APOSTOLADO DA ORAÇÃO'
  if(w===6 && d===firstWeekdayOfMonth(dt,6) && time==='12:00') return 'LEGIÃO DE MARIA'
  if(w===6 && d===firstWeekdayOfMonth(dt,6) && time==='19:00') return 'MÃES QUE ORAM PELOS FILHOS'
  return null
}
function nameOf(a){
  if(!a?.member_id)return ''
  return one(a.liturgy_members)?.name||''
}

export default async function PrintLiturgySchedule({searchParams}){
  const {supabase}=await requireAdmin()
  const sp=await searchParams
  const cycleId=String(sp?.ciclo||'')
  if(!cycleId){
    return <main className="printPage"><p>Ciclo da escala não informado.</p></main>
  }

  const [cycleRes,assignRes]=await Promise.all([
    supabase.from('liturgy_availability_cycles').select('*').eq('id',cycleId).single(),
    supabase.from('liturgy_assignments')
      .select('id,mass_date,role,member_id,notes,liturgy_members(name),mass_schedule(title,mass_time,weekday,location)')
      .eq('cycle_id',cycleId)
      .order('mass_date')
  ])

  const cycle=cycleRes.data
  const assignments=assignRes.data||[]
  if(cycleRes.error||!cycle){
    return <main className="printPage"><p>Não foi possível carregar a escala selecionada.</p></main>
  }

  const groups=new Map()
  for(const a of assignments){
    const ms=one(a.mass_schedule)
    const key=`${isoDate(a.mass_date)}|${ms?.mass_time||''}|${ms?.title||''}`
    if(!groups.has(key))groups.set(key,{date:isoDate(a.mass_date),ms,roles:{}})
    groups.get(key).roles[a.role]=a
  }

  const rows=[...groups.values()].sort((a,b)=>{
    const dc=a.date.localeCompare(b.date)
    return dc!==0?dc:timeOf(a.ms).localeCompare(timeOf(b.ms))
  })

  return <main className="printPage">
    <div className="screenActions">
      <a href={`/admin/escala-liturgica?ciclo=${cycleId}`}>← Voltar para a escala</a>
      <LiturgyPrintButton/>
    </div>

    <header className="printHeader">
      <div className="crestBox"><img src="/brasao-arquidiocese-belem.png" alt="Brasão da Arquidiocese de Belém"/></div>
      <div className="headerText">
        <div className="archdiocese">ARQUIDIOCESE DE BELÉM</div>
        <h1>PARÓQUIA SÃO JOSÉ</h1>
        <p>ESCALA DA PASTORAL DA LITURGIA - {monthTitle(cycle.month)}</p>
      </div>
      <div className="crestBox"><img src="/brasao-paroquia-sao-jose.jpg" alt="Brasão da Paróquia São José"/></div>
    </header>

    {rows.length===0
      ? <p className="empty">A escala deste mês ainda não foi gerada.</p>
      : <table className="schedulePrintTable">
          <thead>
            <tr>
              <th>DATA</th>
              <th>DIA</th>
              <th>HORA</th>
              <th>COMENTÁRIO</th>
              <th>1ª LEITURA</th>
              <th>SALMO</th>
              <th>2ª LEITURA</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i)=>{
              const second=appliesSecond(r.ms)
              const weekend=[0,6].includes(Number(r.ms?.weekday))
              const group=specialGroup(r.date,r.ms)
              return <tr key={`${r.date}-${timeOf(r.ms)}-${i}`} className={weekend?'weekend':'weekday'}>
                <td>{brDate(r.date)}</td>
                <td>{weekday(r.date)}</td>
                <td>
                  <b>{timeOf(r.ms)}</b>
                  {r.ms?.location&&<small>{r.ms.location}</small>}
                </td>
                {group
                  ?<>
                    <td colSpan={3} className="groupAssignment">{group}</td>
                    <td>{second?'—':''}</td>
                  </>
                  :<>
                    <td>{nameOf(r.roles.commentator)||'—'}</td>
                    <td>{nameOf(r.roles.first_reading)||'—'}</td>
                    <td>{nameOf(r.roles.psalmist)||'—'}</td>
                    <td>{second?(nameOf(r.roles.second_reading)||'—'):''}</td>
                  </>}
              </tr>
            })}
          </tbody>
        </table>}

    <footer>
      <p>Paróquia São José – Rua Domingos Marreiros, 104 – Umarizal – Belém/PA</p>
      <p>Escala sujeita a ajustes pela coordenação da Pastoral da Liturgia.</p>
    </footer>
  </main>
}
