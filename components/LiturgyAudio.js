'use client'
import { useState } from 'react'

function cleanForSpeech(value=''){
  return String(value)
    // Remove marcadores de versículos que a fonte cola ao texto: "4bos", "5e", "6Então".
    // Mantém números normais quando estão separados do texto (ex.: "40 dias").
    .replace(/(^|[\s“”"'([{;:])\d{1,3}[a-d]?(?=[A-Za-zÀ-ÖØ-öø-ÿ])/g,'$1')
    // Remove marcadores isolados de versículo entre frases, sem afetar quantidades comuns.
    .replace(/([.!?;:]\s*)\d{1,3}[a-d]?(?=[A-Za-zÀ-ÖØ-öø-ÿ])/g,'$1')
    .replace(/\s+/g,' ')
    .trim()
}
export default function LiturgyAudio({text,label='Ouvir'}){
  const [speaking,setSpeaking]=useState(false)
  function play(){
    if(typeof window==='undefined'||!('speechSynthesis'in window))return
    window.speechSynthesis.cancel()
    const u=new SpeechSynthesisUtterance(cleanForSpeech(text))
    u.lang='pt-BR';u.rate=.92;u.pitch=1
    u.onend=()=>setSpeaking(false);u.onerror=()=>setSpeaking(false)
    setSpeaking(true);window.speechSynthesis.speak(u)
  }
  function stop(){window.speechSynthesis.cancel();setSpeaking(false)}
  return <button type="button" className="audioBtn" onClick={speaking?stop:play}>{speaking?'■ Parar':'🔊 '+label}</button>
}
