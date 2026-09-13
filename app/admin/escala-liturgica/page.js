import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '../../../lib/auth'
import AvailabilityLinkField from '../../../components/AvailabilityLinkField'

function firstOf(value){
  return Array.isArray(value) ? (value.at(0) ?? null) : (value ?? null)
}
function relationOne(value){
  return Array.isArray(value) ? (value.at(0) ?? null) : (value ?? null)
}

const roleLabels={
  commentator:'Comentarista',
  first_reading:'1ª Leitura',
  second_reading:'2ª Leitura',
  psalmist:'Salmista'
}
const roleCaps={
  commentator:'can_commentator',
  first_reading:'can_first_reading',
  second_reading:'can_second_reading',
  psalmist:'can_psalmist'
}
const cycleStatusLabels={
  collecting:'Coletando disponibilidades',
  draft:'Escala em revisão',
  published:'Escala publicada',
  closed:'Ciclo encerrado'
}
const pad=n=>String(n).padStart(2,'0')

function datesFor(month, weekday){
  const d=new Date(`${month}T12:00:00`)
  const y=d.getFullYear(),m=d.getMonth(),out=[]
  for(let day=1;day<=new Date(y,m+1,0).getDate();day++){
    const x=new Date(y,m,day,12)
    if(x.getDay()===weekday)out.push(`${y}-${pad(m+1)}-${pad(day)}`)
  }
  return out
}

function fmtDate(s){
  return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'})
    .format(new Date(`${String(s).slice(0,10)}T12:00:00`))
}
function monthLabel(s){
  return new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'})
    .format(new Date(`${s.slice(0,7)}-01T12:00:00`))
}
function fmtSubmitted(value){
  if(!value)return 'Pendente'
  const d=new Date(value)
  return `Respondido em ${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`
}
function normalizeId(value){
  return value == null ? '' : String(value).trim().toLowerCase()
}
function normalizeDate(value){
  return value == null ? '' : String(value).slice(0,10)
}
function isSecondReadingApplicable(ms){
  const weekday=Number(ms?.weekday)
  const time=String(ms?.mass_time||'').slice(0,5)
  // Na rotina da Paróquia, a 2ª leitura é prevista para as Missas dominicais
  // e para a Missa vespertina de sábado (antecipação do domingo).
  return weekday===0 || (weekday===6 && time==='19:00')
}
function roleApplies(role,ms){
  return role!=='second_reading' || isSecondReadingApplicable(ms)
}

async function addMember(fd){
  'use server'
  const {supabase}=await requireAdmin()
  const payload={
    name:String(fd.get('name')||'').trim(),
    phone:String(fd.get('phone')||'').trim()||null,
    email:String(fd.get('email')||'').trim()||null,
    can_commentator:!!fd.get('commentator'),
    can_first_reading:!!fd.get('first_reading'),
    can_second_reading:!!fd.get('second_reading'),
    can_psalmist:!!fd.get('psalmist')
  }
  if(!payload.name)redirect('/admin/escala-liturgica?erro='+encodeURIComponent('Informe o nome do integrante.'))
  const {error}=await supabase.from('liturgy_members').insert(payload)
  if(error){
    console.error('Erro ao cadastrar integrante da liturgia:',error)
    redirect('/admin/escala-liturgica?erro='+encodeURIComponent(error.message||'Não foi possível cadastrar o integrante.'))
  }
  revalidatePath('/admin/escala-liturgica')
  redirect('/admin/escala-liturgica?ok='+encodeURIComponent('Integrante cadastrado com sucesso.'))
}

async function toggleMember(fd){
  'use server'
  const {supabase}=await requireAdmin()
  await supabase.from('liturgy_members').update({active:fd.get('active')!=='true'}).eq('id',fd.get('id'))
  revalidatePath('/admin/escala-liturgica')
}

async function removeMember(fd){
  'use server'
  const {supabase}=await requireAdmin()
  await supabase.from('liturgy_members').delete().eq('id',fd.get('id'))
  revalidatePath('/admin/escala-liturgica')
}

async function createCycle(fd){
  'use server'
  const {supabase}=await requireAdmin()
  const monthInput=String(fd.get('month')||'').trim()
  if(!/^\d{4}-\d{2}$/.test(monthInput)){
    redirect('/admin/escala-liturgica?erro='+encodeURIComponent('Selecione um mês válido.'))
  }
  const month=`${monthInput}-01`
  const deadline=String(fd.get('deadline')||'').trim()||null
  const notes=String(fd.get('notes')||'').trim()||null
  const {data:cycle,error}=await supabase
    .from('liturgy_availability_cycles')
    .upsert({month,response_deadline:deadline,status:'collecting',notes},{onConflict:'month'})
    .select()
    .single()
  if(error||!cycle){
    console.error('Erro ao abrir mês da escala litúrgica:',error)
    redirect('/admin/escala-liturgica?erro='+encodeURIComponent(error?.message||'Não foi possível abrir o mês.'))
  }
  const membersRes=await supabase.from('liturgy_members').select('id').eq('active',true)
  if(membersRes.error){
    redirect('/admin/escala-liturgica?ciclo='+cycle.id+'&erro='+encodeURIComponent(membersRes.error.message||'O mês foi criado, mas não foi possível carregar os integrantes.'))
  }
  const members=membersRes.data||[]
  if(members.length){
    const reqRes=await supabase
      .from('liturgy_availability_requests')
      .upsert(members.map(m=>({cycle_id:cycle.id,member_id:m.id})),{onConflict:'cycle_id,member_id'})
    if(reqRes.error){
      redirect('/admin/escala-liturgica?ciclo='+cycle.id+'&erro='+encodeURIComponent(reqRes.error.message||'O mês foi criado, mas não foi possível gerar os links individuais.'))
    }
  }
  revalidatePath('/admin/escala-liturgica')
  redirect('/admin/escala-liturgica?ciclo='+cycle.id+'&ok='+encodeURIComponent('Mês aberto com sucesso. Os links individuais de disponibilidade foram preparados.'))
}

async function addMissingRequests(fd){
  'use server'
  const {supabase}=await requireAdmin()
  const cycleId=String(fd.get('cycle_id')||'')
  const membersRes=await supabase.from('liturgy_members').select('id').eq('active',true)
  if(membersRes.error){
    redirect('/admin/escala-liturgica?ciclo='+cycleId+'&erro='+encodeURIComponent(membersRes.error.message||'Não foi possível carregar os integrantes.'))
  }
  const members=membersRes.data||[]
  if(members.length){
    const {error}=await supabase
      .from('liturgy_availability_requests')
      .upsert(members.map(m=>({cycle_id:cycleId,member_id:m.id})),{onConflict:'cycle_id,member_id'})
    if(error){
      redirect('/admin/escala-liturgica?ciclo='+cycleId+'&erro='+encodeURIComponent(error.message||'Não foi possível atualizar os participantes.'))
    }
  }
  revalidatePath('/admin/escala-liturgica')
  redirect('/admin/escala-liturgica?ciclo='+cycleId+'&ok='+encodeURIComponent('Participantes atualizados com sucesso.'))
}

async function setCycleStatus(fd){
  'use server'
  const {supabase}=await requireAdmin()
  await supabase.from('liturgy_availability_cycles').update({status:fd.get('status')}).eq('id',fd.get('id'))
  revalidatePath('/admin/escala-liturgica')
  revalidatePath('/pastorais/liturgia/escala')
}

async function assign(fd){
  'use server'
  const {supabase}=await requireAdmin()
  const id=fd.get('id')
  const member_id=fd.get('member_id')||null
  await supabase.from('liturgy_assignments').update({member_id}).eq('id',id)
  revalidatePath('/admin/escala-liturgica')
  revalidatePath('/pastorais/liturgia/escala')
}

async function generateSchedule(fd){
  'use server'
  const {supabase}=await requireAdmin()
  const cycleId=String(fd.get('cycle_id')||'').trim()
  if(!cycleId)redirect('/admin/escala-liturgica?erro='+encodeURIComponent('Ciclo mensal não informado.'))

  const {data:cycle,error:cycleError}=await supabase
    .from('liturgy_availability_cycles')
    .select('*')
    .eq('id',cycleId)
    .single()

  if(cycleError||!cycle){
    redirect('/admin/escala-liturgica?erro='+encodeURIComponent(cycleError?.message||'Não foi possível carregar o mês da escala.'))
  }

  const month=String(cycle.month).slice(0,7)

  const [schedulesRes,membersRes,reqsRes]=await Promise.all([
    supabase.from('mass_schedule').select('*').eq('active',true).order('weekday').order('mass_time'),
    supabase.from('liturgy_members').select('*').eq('active',true),
    supabase.from('liturgy_availability_requests').select('id,member_id,submitted_at').eq('cycle_id',cycleId)
  ])

  const baseError=schedulesRes.error||membersRes.error||reqsRes.error
  if(baseError){
    console.error('Erro ao carregar dados para gerar escala:',baseError)
    redirect('/admin/escala-liturgica?ciclo='+cycleId+'&erro='+encodeURIComponent(baseError.message||'Não foi possível carregar os dados para gerar a escala.'))
  }

  const schedules=schedulesRes.data||[]
  const members=membersRes.data||[]
  const reqs=(reqsRes.data||[]).filter(r=>r.submitted_at)
  const reqIds=reqs.map(r=>r.id)

  if(!reqIds.length){
    redirect('/admin/escala-liturgica?ciclo='+cycleId+'&erro='+encodeURIComponent('Nenhum integrante respondeu à disponibilidade deste mês.'))
  }

  const choicesRes=await supabase
    .from('liturgy_availability_choices')
    .select('request_id,mass_schedule_id,mass_date')
    .in('request_id',reqIds)

  if(choicesRes.error){
    console.error('Erro ao carregar disponibilidades:',choicesRes.error)
    redirect('/admin/escala-liturgica?ciclo='+cycleId+'&erro='+encodeURIComponent(choicesRes.error.message||'Não foi possível ler as disponibilidades informadas.'))
  }

  const choices=choicesRes.data||[]
  if(!choices.length){
    redirect('/admin/escala-liturgica?ciclo='+cycleId+'&erro='+encodeURIComponent('As respostas foram recebidas, mas nenhuma missa foi marcada como disponível.'))
  }

  const reqById=new Map(reqs.map(r=>[normalizeId(r.id),normalizeId(r.member_id)]))
  const available=new Set()

  for(const c of choices){
    const mid=reqById.get(normalizeId(c.request_id))
    if(!mid)continue
    available.add(`${mid}|${normalizeId(c.mass_schedule_id)}|${normalizeDate(c.mass_date)}`)
  }

  if(!available.size){
    redirect('/admin/escala-liturgica?ciclo='+cycleId+'&erro='+encodeURIComponent('Não foi possível relacionar as respostas aos integrantes. Gere novamente após atualizar os participantes.'))
  }

  const totalCount=new Map()
  const roleCount=new Map()
  const rows=[]
  let filled=0
  let open=0

  for(const ms of schedules){
    for(const date of datesFor(month,Number(ms.weekday))){
      const used=new Set()

      for(const role of Object.keys(roleLabels)){
        let pick=null

        if(roleApplies(role,ms)){
          const cap=roleCaps[role]
          const scheduleId=normalizeId(ms.id)

          const candidates=members
            .filter(m=>{
              const memberId=normalizeId(m.id)
              return Boolean(
                m[cap] &&
                available.has(`${memberId}|${scheduleId}|${date}`) &&
                !used.has(memberId)
              )
            })
            .sort((a,b)=>{
              const totalDiff=(totalCount.get(normalizeId(a.id))||0)-(totalCount.get(normalizeId(b.id))||0)
              if(totalDiff!==0)return totalDiff
              const roleDiff=(roleCount.get(`${normalizeId(a.id)}|${role}`)||0)-(roleCount.get(`${normalizeId(b.id)}|${role}`)||0)
              if(roleDiff!==0)return roleDiff
              return String(a.name||'').localeCompare(String(b.name||''),'pt-BR')
            })

          pick=firstOf(candidates)

          if(pick){
            const memberId=normalizeId(pick.id)
            used.add(memberId)
            totalCount.set(memberId,(totalCount.get(memberId)||0)+1)
            roleCount.set(`${memberId}|${role}`,(roleCount.get(`${memberId}|${role}`)||0)+1)
            filled++
          }else{
            open++
          }
        }

        rows.push({
          cycle_id:cycleId,
          mass_schedule_id:ms.id,
          mass_date:date,
          role,
          member_id:pick?.id||null,
          notes:roleApplies(role,ms)?null:'not_applicable'
        })
      }
    }
  }

  const deleteRes=await supabase.from('liturgy_assignments').delete().eq('cycle_id',cycleId)
  if(deleteRes.error){
    redirect('/admin/escala-liturgica?ciclo='+cycleId+'&erro='+encodeURIComponent(deleteRes.error.message||'Não foi possível substituir a escala anterior.'))
  }

  if(rows.length){
    const insertRes=await supabase.from('liturgy_assignments').insert(rows)
    if(insertRes.error){
      console.error('Erro ao gravar escala gerada:',insertRes.error)
      redirect('/admin/escala-liturgica?ciclo='+cycleId+'&erro='+encodeURIComponent(insertRes.error.message||'Não foi possível gravar a escala gerada.'))
    }
  }

  await supabase.from('liturgy_availability_cycles').update({status:'draft'}).eq('id',cycleId)
  revalidatePath('/admin/escala-liturgica')
  revalidatePath('/pastorais/liturgia/escala')
  redirect('/admin/escala-liturgica?ciclo='+cycleId+'&ok='+encodeURIComponent(`Escala gerada: ${filled} designações automáticas e ${open} vagas ainda em aberto.`))
}

export default async function Page({searchParams}){
  const {supabase}=await requireAdmin()
  const sp=await searchParams

  const [membersRes,cyclesRes]=await Promise.all([
    supabase.from('liturgy_members').select('*').order('active',{ascending:false}).order('name'),
    supabase.from('liturgy_availability_cycles').select('*').order('month',{ascending:false})
  ])

  const members=Array.isArray(membersRes.data)?membersRes.data:[]
  const cycles=Array.isArray(cyclesRes.data)?cyclesRes.data:[]
  let pageError=sp?.erro||membersRes.error?.message||cyclesRes.error?.message||null
  const pageSuccess=sp?.ok||null
  const firstCycle=firstOf(cycles)
  const cycleId=sp?.ciclo||firstCycle?.id||null
  const selected=(cycleId?cycles.find(c=>c.id===cycleId):null)||firstCycle

  let requests=[],assignments=[]
  let cycleLoadError=null

  if(selected){
    const [r,a]=await Promise.all([
      supabase.from('liturgy_availability_requests').select('*,liturgy_members(name,phone)').eq('cycle_id',selected.id),
      supabase.from('liturgy_assignments').select('*,liturgy_members(name),mass_schedule(title,mass_time,weekday)').eq('cycle_id',selected.id).order('mass_date')
    ])
    requests=Array.isArray(r.data)?r.data:[]
    assignments=Array.isArray(a.data)?a.data:[]
    cycleLoadError=r.error?.message||a.error?.message||null
  }

  if(!pageError&&cycleLoadError)pageError=cycleLoadError

  const origin='https://paroquia-sao-jose.vercel.app'
  const grouped={}
  for(const a of assignments){
    const key=`${a.mass_date}|${a.mass_schedule_id}`
    ;(grouped[key]??=[]).push(a)
  }

  return <>
    <div className="adminTitle">
      <h1>Escala da Pastoral da Liturgia</h1>
      <p>Cadastre ministros, recolha disponibilidades e gere a escala mensal de forma equilibrada.</p>
    </div>

    {pageSuccess&&<div className="panel" style={{marginBottom:'16px',borderLeft:'4px solid #2e7d32'}}><b>{pageSuccess}</b></div>}
    {pageError&&<div className="panel" style={{marginBottom:'16px',borderLeft:'4px solid #b42318'}}><b>Não foi possível concluir a operação.</b><p style={{marginBottom:0}}>{pageError}</p></div>}

    <div className="adminCards liturgyAdminGrid">
      <article>
        <h3>1. Integrantes</h3>
        <details>
          <summary>+ Cadastrar integrante</summary>
          <form action={addMember} className="adminForm compact liturgyMemberForm">
            <label>Nome<input name="name" required/></label>
            <label>WhatsApp<input name="phone"/></label>
            <label>E-mail<input name="email" type="email"/></label>
            <div className="checkGrid span2">
              <label><input type="checkbox" name="commentator"/> Comentarista</label>
              <label><input type="checkbox" name="first_reading"/> 1ª Leitura</label>
              <label><input type="checkbox" name="second_reading"/> 2ª Leitura</label>
              <label><input type="checkbox" name="psalmist"/> Salmista</label>
            </div>
            <button>Cadastrar</button>
          </form>
        </details>

        <div className="memberList">
          {members.map(m=><div key={m.id} className="memberRow">
            <div>
              <b>{m.name}</b>
              <small>{[
                m.can_commentator&&'Comentarista',
                m.can_first_reading&&'1ª Leitura',
                m.can_second_reading&&'2ª Leitura',
                m.can_psalmist&&'Salmista'
              ].filter(Boolean).join(' · ')||'Sem função definida'}</small>
            </div>
            <div className="actions">
              <form action={toggleMember}>
                <input type="hidden" name="id" value={m.id}/>
                <input type="hidden" name="active" value={String(m.active)}/>
                <button>{m.active?'Desativar':'Ativar'}</button>
              </form>
              <form action={removeMember}>
                <input type="hidden" name="id" value={m.id}/>
                <button className="danger">Excluir</button>
              </form>
            </div>
          </div>)}
        </div>
      </article>

      <article>
        <h3>2. Abrir disponibilidade mensal</h3>
        <form action={createCycle} className="adminForm compact liturgyCycleForm">
          <label>Mês<input type="month" name="month" required/></label>
          <label>Prazo para responder<input type="date" name="deadline"/></label>
          <label className="span2">Observações<input name="notes" placeholder="Ex.: responder até o dia 27"/></label>
          <button>Abrir mês</button>
        </form>

        <div className="cycleTabs">
          {cycles.map(c=><a
            className={selected?.id===c.id?'active':''}
            key={c.id}
            href={`/admin/escala-liturgica?ciclo=${c.id}`}
          >{monthLabel(c.month)} · {cycleStatusLabels[c.status]||c.status}</a>)}
        </div>
      </article>
    </div>

    {selected&&<>
      <section className="panel liturgyCyclePanel">
        <div className="rowBetween">
          <div>
            <h2>{monthLabel(selected.month)}</h2>
            <p>Status: <b>{cycleStatusLabels[selected.status]||selected.status}</b>
              {selected.response_deadline&&<> · Respostas até {fmtDate(selected.response_deadline)}</>}
            </p>
          </div>
          <div className="actions">
            <form action={addMissingRequests}>
              <input type="hidden" name="cycle_id" value={selected.id}/>
              <button>Atualizar participantes</button>
            </form>
            <form action={generateSchedule}>
              <input type="hidden" name="cycle_id" value={selected.id}/>
              <button>Gerar escala automática</button>
            </form>
            {selected.status!=='published'
              ?<form action={setCycleStatus}>
                <input type="hidden" name="id" value={selected.id}/>
                <input type="hidden" name="status" value="published"/>
                <button>Publicar escala</button>
              </form>
              :<form action={setCycleStatus}>
                <input type="hidden" name="id" value={selected.id}/>
                <input type="hidden" name="status" value="draft"/>
                <button>Retirar publicação</button>
              </form>}
          </div>
        </div>
      </section>

      <section className="adminCreate">
        <h3>Links individuais de disponibilidade</h3>
        <p className="adminHint">Copie o link de cada integrante e envie pelo WhatsApp. Cada pessoa vê apenas o próprio formulário.</p>
        <div className="adminTableWrap">
          <table className="adminTable">
            <thead><tr><th>Integrante</th><th>Resposta</th><th>Link</th></tr></thead>
            <tbody>
              {requests.map(r=><tr key={r.id}>
                <td>{relationOne(r.liturgy_members)?.name||'Integrante'}</td>
                <td>{fmtSubmitted(r.submitted_at)}</td>
                <td><AvailabilityLinkField value={`${origin}/disponibilidade-liturgia/${r.token}`}/></td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </section>

      <section className="adminCreate">
        <div className="rowBetween">
          <div>
            <h3>Escala sugerida</h3>
            <p className="adminHint">A geração considera apenas quem informou disponibilidade, respeita as funções cadastradas e procura equilibrar as participações. A 2ª Leitura é aplicada às Missas dominicais e à Missa de sábado às 19h.</p>
          </div>
          {selected.status==='published'&&<a className="adminPrimary" href="/pastorais/liturgia/escala" target="_blank">Ver escala pública</a>}
        </div>

        {assignments.length===0
          ?<p>A escala ainda não foi gerada.</p>
          :<div className="scheduleAdminList">
            {Object.entries(grouped).map(([key,rows])=>{
              const first=firstOf(rows)
              const ms=relationOne(first?.mass_schedule)
              return <article className="scheduleAdminCard" key={key}>
                <h4>{first?fmtDate(first.mass_date):''} · {ms?.mass_time?.slice(0,5)||'--:--'} — {ms?.title||'Celebração'}</h4>
                {rows.map(a=>{
                  const assignmentMs=relationOne(a.mass_schedule)
                  const applicable=roleApplies(a.role,assignmentMs)
                  return <div className="assignmentRow" key={a.id}>
                    <b>{roleLabels[a.role]}</b>
                    {!applicable
                      ?<span style={{opacity:.65,fontStyle:'italic'}}>Não se aplica</span>
                      :<form action={assign}>
                        <input type="hidden" name="id" value={a.id}/>
                        <select name="member_id" defaultValue={a.member_id||''}>
                          <option value="">Vaga em aberto</option>
                          {members.filter(m=>m.active&&m[roleCaps[a.role]]).map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                        <button>Salvar</button>
                      </form>}
                  </div>
                })}
              </article>
            })}
          </div>}
      </section>
    </>}
  </>
}
