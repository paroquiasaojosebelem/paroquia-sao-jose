'use client'
import { useState } from 'react'
export default function CopyPixButton({value}){
  const [copied,setCopied]=useState(false)
  async function copy(){
    try{await navigator.clipboard.writeText(value);setCopied(true);setTimeout(()=>setCopied(false),1800)}catch{}
  }
  if(!value)return null
  return <button type="button" className="ghost" onClick={copy}>{copied?'PIX copiado ✓':'Copiar chave PIX'}</button>
}
