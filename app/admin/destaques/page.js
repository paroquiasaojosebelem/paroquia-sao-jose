import { revalidatePath } from 'next/cache'
import { requireAdmin } from '../../../lib/auth'

const BUCKET='parish-banners'

function clean(v){return String(v||'').trim()||null}
function safeName(name='imagem'){return name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/-+/g,'-').toLowerCase()}

async function uploadImage(supabase,file,prefix){
  if(!file || typeof file.arrayBuffer!=='function' || !file.size) return null
  if(!String(file.type||'').startsWith('image/')) throw new Error('O arquivo enviado precisa ser uma imagem.')
  if(file.size>8*1024*1024) throw new Error('A imagem deve ter no máximo 8 MB.')
  const path=`${new Date().getFullYear()}/${Date.now()}-${prefix}-${safeName(file.name)}`
  const bytes=Buffer.from(await file.arrayBuffer())
  const {error}=await supabase.storage.from(BUCKET).upload(path,bytes,{contentType:file.type,upsert:false})
  if(error) throw new Error(`Falha ao enviar imagem: ${error.message}`)
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

async function save(fd){
  'use server'
  const {supabase}=await requireAdmin()
  const id=clean(fd.get('id'))
  try{
    const desktopUpload=await uploadImage(supabase,fd.get('image_file'),'desktop')
    const mobileUpload=await uploadImage(supabase,fd.get('mobile_image_file'),'mobile')
    const imageUrl=desktopUpload || clean(fd.get('image_url_existing')) || clean(fd.get('image_url'))
    if(!imageUrl) throw new Error('Informe ou envie a imagem principal do destaque.')
    const payload={
      title:clean(fd.get('title')),category:clean(fd.get('category')),summary:clean(fd.get('summary')),
      image_url:imageUrl,mobile_image_url:mobileUpload || clean(fd.get('mobile_image_url_existing')) || clean(fd.get('mobile_image_url')),
      image_alt:clean(fd.get('image_alt')),button_label:clean(fd.get('button_label')),button_url:clean(fd.get('button_url')),
      display_type:fd.get('display_type')==='complete'?'complete':'editorial',
      sort_order:Number(fd.get('sort_order')||0),starts_on:clean(fd.get('starts_on')),ends_on:clean(fd.get('ends_on')),
      active:fd.get('active')!=='false',updated_at:new Date().toISOString()
    }
    const query=id?supabase.from('highlights').update(payload).eq('id',id):supabase.from('highlights').insert(payload)
    const {error}=await query
    if(error) throw error
  }catch(error){
    console.error('Erro ao salvar destaque',error)
    throw new Error(error?.message||'Não foi possível salvar o destaque.')
  }
  revalidatePath('/admin/destaques');revalidatePath('/')
}

async function act(fd){
  'use server'
  const {supabase}=await requireAdmin();const id=fd.get('id');const op=fd.get('op')
  if(op==='delete') await supabase.from('highlights').delete().eq('id',id)
  else await supabase.from('highlights').update({active:fd.get('active')!=='true',updated_at:new Date().toISOString()}).eq('id',id)
  revalidatePath('/admin/destaques');revalidatePath('/')
}

const FieldHelp=({children})=><small className="adminHint">{children}</small>

export default async function Page(){
  const {supabase}=await requireAdmin()
  const {data,error}=await supabase.from('highlights').select('*').order('sort_order').order('created_at',{ascending:false})
  const rows=data||[]
  return <>
    <div className="adminTitle"><small>CONTEÚDO DA PÁGINA INICIAL</small><h1>Destaques / Banners</h1><p>Gerencie os anúncios rotativos da página inicial, sem alterar o código do site.</p></div>
    {error&&<div className="adminAlert">A tabela de destaques ainda não está disponível. Execute primeiro o SQL da V6.14 no Supabase.</div>}
    <details className="adminCreate" open={!rows.length}><summary>+ Novo destaque</summary>
      <form action={save} className="adminForm highlightAdminForm">
        <div className="formTwo"><label>Formato<select name="display_type" defaultValue="editorial"><option value="editorial">Foto + texto sobreposto</option><option value="complete">Arte pronta (banner completo)</option></select></label><label>Ordem<input type="number" name="sort_order" defaultValue="10" min="0"/></label></div>
        <label>Categoria<input name="category" placeholder="Ex.: FESTIVIDADE, ORAÇÃO, AVISO"/></label>
        <label>Título<input name="title" placeholder="Ex.: Festividade de São José 2027"/></label>
        <label>Texto curto<textarea name="summary" rows="3" placeholder="Uma chamada breve para o destaque."/></label>
        <div className="formTwo"><label>Imagem principal<input type="file" name="image_file" accept="image/*"/><FieldHelp>Recomendado: 1600 × 600 px. Máximo 8 MB.</FieldHelp></label><label>Ou URL da imagem<input name="image_url" placeholder="https://..."/></label></div>
        <div className="formTwo"><label>Imagem para celular (opcional)<input type="file" name="mobile_image_file" accept="image/*"/><FieldHelp>Recomendado: 900 × 1100 px. Se não enviar, será usada a imagem principal.</FieldHelp></label><label>Ou URL da imagem mobile<input name="mobile_image_url" placeholder="https://..."/></label></div>
        <label>Descrição acessível da imagem<input name="image_alt" placeholder="Descreva brevemente o conteúdo da imagem"/></label>
        <div className="formTwo"><label>Texto do botão<input name="button_label" placeholder="Saiba mais"/></label><label>Link do botão<input name="button_url" placeholder="/festividade ou https://..."/></label></div>
        <div className="formTwo"><label>Exibir a partir de<input type="date" name="starts_on"/></label><label>Exibir até<input type="date" name="ends_on"/></label></div>
        <button>Salvar destaque</button>
      </form>
    </details>
    <div className="highlightAdminList">{rows.map(x=><article key={x.id} className="highlightAdminCard">
      <div className="highlightAdminPreview">{x.image_url?<img src={x.image_url} alt=""/>:<span>Sem imagem</span>}</div>
      <div className="highlightAdminInfo"><div className="rowBetween"><div><small>{x.category||'DESTAQUE'} · ordem {x.sort_order??0}</small><h3>{x.title||'Banner sem título'}</h3></div><span className={x.active?'status on':'status'}>{x.active?'Ativo':'Inativo'}</span></div>
      <p>{x.summary}</p><small>{x.display_type==='complete'?'Arte pronta':'Foto + texto'}{x.starts_on?` · início ${new Date(`${x.starts_on}T12:00:00`).toLocaleDateString('pt-BR')}`:''}{x.ends_on?` · fim ${new Date(`${x.ends_on}T12:00:00`).toLocaleDateString('pt-BR')}`:''}</small>
      <details><summary>Editar</summary><form action={save} className="adminForm highlightAdminForm"><input type="hidden" name="id" value={x.id}/><input type="hidden" name="image_url_existing" value={x.image_url||''}/><input type="hidden" name="mobile_image_url_existing" value={x.mobile_image_url||''}/>
        <div className="formTwo"><label>Formato<select name="display_type" defaultValue={x.display_type||'editorial'}><option value="editorial">Foto + texto sobreposto</option><option value="complete">Arte pronta (banner completo)</option></select></label><label>Ordem<input type="number" name="sort_order" defaultValue={x.sort_order??0}/></label></div>
        <label>Categoria<input name="category" defaultValue={x.category||''}/></label><label>Título<input name="title" defaultValue={x.title||''}/></label><label>Texto curto<textarea name="summary" rows="3" defaultValue={x.summary||''}/></label>
        <div className="formTwo"><label>Trocar imagem principal<input type="file" name="image_file" accept="image/*"/></label><label>URL atual / nova<input name="image_url" placeholder={x.image_url||'https://...'}/></label></div>
        <div className="formTwo"><label>Trocar imagem mobile<input type="file" name="mobile_image_file" accept="image/*"/></label><label>URL mobile atual / nova<input name="mobile_image_url" placeholder={x.mobile_image_url||'https://...'}/></label></div>
        <label>Descrição acessível<input name="image_alt" defaultValue={x.image_alt||''}/></label>
        <div className="formTwo"><label>Texto do botão<input name="button_label" defaultValue={x.button_label||''}/></label><label>Link do botão<input name="button_url" defaultValue={x.button_url||''}/></label></div>
        <div className="formTwo"><label>Exibir a partir de<input type="date" name="starts_on" defaultValue={x.starts_on||''}/></label><label>Exibir até<input type="date" name="ends_on" defaultValue={x.ends_on||''}/></label></div>
        <button>Salvar alterações</button></form></details>
      <div className="actions"><form action={act}><input type="hidden" name="id" value={x.id}/><input type="hidden" name="active" value={String(x.active)}/><button>{x.active?'Desativar':'Ativar'}</button></form><form action={act}><input type="hidden" name="id" value={x.id}/><input type="hidden" name="op" value="delete"/><button className="danger">Excluir</button></form></div></div>
    </article>)}</div>
  </>
}
