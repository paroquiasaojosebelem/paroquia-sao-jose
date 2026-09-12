'use client'

import { useState } from 'react'

export default function AvailabilityLinkField({ value }) {
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Fallback: select the field so the user can copy manually.
      const input = document.getElementById(`availability-${encodeURIComponent(value)}`)
      input?.select()
    }
  }

  return (
    <div style={{display:'flex', gap:'8px', alignItems:'center', minWidth:0}}>
      <input
        id={`availability-${encodeURIComponent(value)}`}
        readOnly
        value={value}
        onFocus={e => e.currentTarget.select()}
        style={{minWidth:0, flex:1}}
      />
      <button type="button" onClick={copyLink}>
        {copied ? 'Copiado!' : 'Copiar'}
      </button>
    </div>
  )
}
