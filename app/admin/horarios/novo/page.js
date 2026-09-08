import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../../../lib/supabase/server'

async function salvarHorario(formData) {
  'use server'

  const supabase = await createClient()

  const weekday = Number(formData.get('weekday'))
  const mass_time = formData.get('mass_time')
  const title = formData.get('title')?.trim() || 'Santa Missa'
  const notes = formData.get('notes')?.trim() || null

  const { error } = await supabase
    .from('mass_schedule')
    .insert({
      weekday,
      mass_time,
      title,
      notes,
      active: true
    })

  if (error) {
    throw new Error(`Erro ao cadastrar horário: ${error.message}`)
  }

  redirect('/admin/horarios')
}

export default function NovoHorario() {
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
          Novo horário de Santa Missa
        </h1>

        <p>
          Cadastre um novo horário para publicação no site da Paróquia São José.
        </p>
      </div>

      <form
        action={salvarHorario}
        style={{
          background: '#fff',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 3px 15px rgba(0,0,0,.08)'
        }}
      >

        <label style={label}>
          Dia da semana
          <select
            name="weekday"
            required
            defaultValue=""
            style={campo}
          >
            <option value="" disabled>
              Selecione o dia
            </option>

            <option value="0">Domingo</option>
            <option value="1">Segunda-feira</option>
            <option value="2">Terça-feira</option>
            <option value="3">Quarta-feira</option>
            <option value="4">Quinta-feira</option>
            <option value="5">Sexta-feira</option>
            <option value="6">Sábado</option>
          </select>
        </label>

        <label style={label}>
          Horário
          <input
            type="time"
            name="mass_time"
            required
            style={campo}
          />
        </label>

        <label style={label}>
          Título
          <input
            type="text"
            name="title"
            defaultValue="Santa Missa"
            required
            style={campo}
          />
        </label>

        <label style={label}>
          Observações
          <textarea
            name="notes"
            rows="4"
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
            Salvar horário
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
