import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../../../../lib/supabase/server'

const dias = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
]

async function atualizarHorario(formData) {
  'use server'

  const supabase = await createClient()

  const id = formData.get('id')
  const weekday = Number(formData.get('weekday'))
  const mass_time = formData.get('mass_time')
  const title = formData.get('title')?.trim() || 'Santa Missa'
  const notes = formData.get('notes')?.trim() || null

  const { error } = await supabase
    .from('mass_schedule')
    .update({
      weekday,
      mass_time,
      title,
      notes
    })
    .eq('id', id)

  if (error) {
    throw new Error(`Erro ao atualizar horário: ${error.message}`)
  }

  redirect('/admin/horarios')
}

export default async function EditarHorario({ params }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: horario, error } = await supabase
    .from('mass_schedule')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !horario) {
    return (
      <main style={{ padding: '36px' }}>
        <h1>Horário não encontrado</h1>
        <Link href="/admin/horarios">
          ← Voltar para horários
        </Link>
      </main>
    )
  }

  const campo = {
    width: '100%',
    padding: '12px',
    border: '1px solid #d6d6d6',
    borderRadius: '8px',
    fontSize: '16px',
    marginTop: '6px'
  }

  const label = {
    display: 'block',
    fontWeight: '600',
    marginBottom: '18px'
  }

  return (
    <main style={{ padding: '36px', maxWidth: '850px' }}>
      <div style={{ marginBottom: '30px' }}>
        <Link
          href="/admin/horarios"
          style={{
            color: '#06466d',
            textDecoration: 'none',
            fontWeight: '600'
          }}
        >
          ← Voltar para horários
        </Link>

        <h1 style={{ marginTop: '20px' }}>
          Editar horário de Santa Missa
        </h1>

        <p>
          Altere as informações do horário selecionado.
        </p>
      </div>

      <form
        action={atualizarHorario}
        style={{
          background: '#fff',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 3px 15px rgba(0,0,0,.08)'
        }}
      >
        <input type="hidden" name="id" value={horario.id} />

        <label style={label}>
          Dia da semana
          <select
            name="weekday"
            required
            defaultValue={String(horario.weekday)}
            style={campo}
          >
            {dias.map((dia, index) => (
              <option key={dia} value={index}>
                {dia}
              </option>
            ))}
          </select>
        </label>

        <label style={label}>
          Horário
          <input
            type="time"
            name="mass_time"
            required
            defaultValue={horario.mass_time?.slice(0, 5)}
            style={campo}
          />
        </label>

        <label style={label}>
          Título
          <input
            type="text"
            name="title"
            required
            defaultValue={horario.title || 'Santa Missa'}
            style={campo}
          />
        </label>

        <label style={label}>
          Observações
          <textarea
            name="notes"
            rows="4"
            defaultValue={horario.notes || ''}
            placeholder="Ex.: Missa das Famílias, Shopping Boulevard..."
            style={{
              ...campo,
              resize: 'vertical'
            }}
          />
        </label>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginTop: '28px'
          }}
        >
          <button
            type="submit"
            style={{
              background: '#89521f',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '13px 25px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '15px'
            }}
          >
            Salvar alterações
          </button>

          <Link
            href="/admin/horarios"
            style={{
              border: '1px solid #bbb',
              borderRadius: '8px',
              padding: '12px 22px',
              textDecoration: 'none',
              color: '#333'
            }}
          >
            Cancelar
          </Link>
        </div>
      </form>
    </main>
  )
}
