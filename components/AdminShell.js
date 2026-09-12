import Link from 'next/link'
import { logout } from '../app/admin/actions'

const items = [
  ['▦','Dashboard','/admin'],['◷','Horários','/admin/horarios'],['♟','Pastorais','/admin/pastorais'],
  ['▤','Notícias','/admin/noticias'],['🙏','Intenções','/admin/intencoes'],['📖','Liturgia','/admin/liturgia'],
  ['🔴','Transmissões','/admin/transmissoes'],['⚙','Configurações','/admin/configuracoes']
]
export default function AdminShell({profile, children}){
  return <main className="adminShell">
    <aside className="adminNav"><Link className="adminBrand" href="/">Paróquia São José</Link><p>Painel Administrativo</p>
      <nav>{items.map(([icon,label,href])=><Link key={href} href={href}>{icon} <span>{label}</span></Link>)}</nav>
      <div className="adminUser"><small>Usuário</small><b>{profile?.full_name}</b><form action={logout}><button className="ghostBtn">Sair</button></form></div>
    </aside><section className="adminContent">{children}</section>
  </main>
}
