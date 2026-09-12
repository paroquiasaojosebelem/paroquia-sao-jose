import Link from 'next/link'
export default function Header(){return <>
  <div className="welcomeBar"><div className="wrap">BEM-VINDO(A) &nbsp;|&nbsp; PARÓQUIA SÃO JOSÉ – UMARIZAL, BELÉM/PA <span>Instagram &nbsp; Facebook &nbsp; YouTube</span></div></div>
  <header className="brand"><div className="wrap brandGrid"><img src="/brasao-paroquia.jpg" alt="Brasão da Paróquia São José" className="crest"/><div><h1>PARÓQUIA <strong>SÃO JOSÉ</strong></h1><p>UMARIZAL – BELÉM/PA</p><small>Arquidiocese de Belém | Região Episcopal: Sant’Ana<br/>Pároco: Padre Vandilson &nbsp; | &nbsp; Vigário: Padre Cleber</small></div><div className="quote">Glorioso São José,<br/>rogai por nós!</div></div></header>
  <nav className="nav"><div className="wrap navlinks"><Link href="/">INÍCIO</Link><Link href="/pastorais">PASTORAIS</Link><Link href="/horarios">HORÁRIOS</Link><Link href="/liturgia">LITURGIA DIÁRIA</Link><Link href="/terco-virtual">TERÇO VIRTUAL</Link><Link href="/transmissao">AO VIVO</Link><Link href="/dizimo">DÍZIMO</Link><Link href="/intencoes">INTENÇÕES</Link><Link href="/noticias">NOTÍCIAS</Link><Link href="/contato">CONTATO</Link></div></nav>
</>}
