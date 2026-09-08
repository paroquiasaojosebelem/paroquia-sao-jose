import { createClient } from '../../../lib/supabase/server'
import Link from 'next/link'
const dias = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
]

function formatarHora(hora) {
  if (!hora) return '-'
  return hora.slice(0, 5)
}

export default async function AdminHorarios() {
  const supabase = await createClient()

  const { data: horarios = [] } = await supabase
    .from('mass_schedule')
    .select('*')
    .order('weekday')
    .order('mass_time')

  return (
    <main style={{ padding: '36px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}
      >
        <div>
          <h1 style={{ marginBottom: '8px' }}>
            Horários das Santas Missas
          </h1>

          <p style={{ margin: 0 }}>
            Gerencie aqui os horários cadastrados no site.
          </p>
        </div>

        <Link
  href="/admin/horarios/novo"
  style={{
    background: '#89521f',
    color: '#fff',
    borderRadius: '8px',
    padding: '12px 18px',
    fontWeight: '600',
    textDecoration: 'none',
    display: 'inline-block'
  }}
>
  + Novo horário
</Link>
      </div>

      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 3px 13px rgba(0,0,0,.08)',
          overflowX: 'auto'
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}
        >
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px' }}>Dia</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Horário</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Título</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Observações</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Ações</th>
            </tr>
          </thead>

          <tbody>
            {horarios.map((item) => (
              <tr key={item.id} style={{ borderTop: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>
                  {dias[item.weekday] || item.weekday}
                </td>

                <td style={{ padding: '12px' }}>
                  {formatarHora(item.mass_time)}
                </td>

                <td style={{ padding: '12px' }}>
                  {item.title || '-'}
                </td>

                <td style={{ padding: '12px' }}>
                  {item.notes || '-'}
                </td>

                <td style={{ padding: '12px' }}>
                  <span
                    style={{
                      padding: '5px 10px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      background: item.active ? '#e8f6ec' : '#f1f1f1',
                      color: item.active ? '#176b32' : '#666'
                    }}
                  >
                    {item.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>

                <td style={{ padding: '12px' }}>
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}
                  >
                   <a
  href={`/admin/horarios/editar/${item.id}`}
  style={{
    border: '1px solid #0b4a6f',
    background: '#fff',
    color: '#0b4a6f',
    borderRadius: '6px',
    padding: '7px 10px',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block'
  }}
>
  Editar
</a>

                    <button
                      style={{
                        border: '1px solid #89521f',
                        background: '#fff',
                        color: '#89521f',
                        borderRadius: '6px',
                        padding: '7px 10px',
                        cursor: 'pointer'
                      }}
                    >
                      {item.active ? 'Desativar' : 'Ativar'}
                    </button>

                    <button
                      style={{
                        border: '1px solid #a33',
                        background: '#fff',
                        color: '#a33',
                        borderRadius: '6px',
                        padding: '7px 10px',
                        cursor: 'pointer'
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
