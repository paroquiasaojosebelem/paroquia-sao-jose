'use client'

export default function LiturgyPrintButton(){
  return (
    <button className="printButton" type="button" onClick={()=>window.print()}>
      Imprimir / Salvar em PDF
    </button>
  )
}
