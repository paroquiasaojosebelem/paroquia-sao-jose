import { createClient } from '../../../lib/supabase/server'

export default async function AdminHorarios() {
  const supabase = await createClient()

  const { data: horarios = [] } = await supabase
    .from('mass_schedule')
    .select('*')
    .order('weekday')
    .order('mass_time')

  return (
    <main style={{ padding: '36px' }}>
      <h1>Horários das Santas Missas</h1>

      <p style={{ marginBottom: '24px' }}>
        Gerencie aqui os horários cadastrados no site.
      </p>

      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 3px 13px rgba(0,0,0,.08)'
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
            </tr>
          </thead>

          <tbody>
            {horarios.map((item) => (
              <tr key={item.id} style={{ borderTop: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>{item.weekday}</td>
                <td style={{ padding: '12px' }}>{item.mass_time}</td>
                <td style={{ padding: '12px' }}>{item.title || '-'}</td>
                <td style={{ padding: '12px' }}>{item.notes || '-'}</td>
                <td style={{ padding: '12px' }}>
                  {item.active ? 'Ativo' : 'Inativo'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
