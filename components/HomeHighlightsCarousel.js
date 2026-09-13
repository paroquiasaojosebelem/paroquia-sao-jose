'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

export default function HomeHighlightsCarousel({ items = [] }) {
  const slides = useMemo(() => (items || []).filter(Boolean), [items])
  const [index, setIndex] = useState(0)
  const touchStart = useRef(null)

  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(() => setIndex(i => (i + 1) % slides.length), 6000)
    return () => clearInterval(timer)
  }, [slides.length])

  useEffect(() => {
    if (index >= slides.length) setIndex(0)
  }, [index, slides.length])

  if (!slides.length) return null

  const go = delta => setIndex(i => (i + delta + slides.length) % slides.length)
  const onTouchStart = e => { touchStart.current = e.touches?.[0]?.clientX ?? null }
  const onTouchEnd = e => {
    if (touchStart.current == null) return
    const end = e.changedTouches?.[0]?.clientX ?? touchStart.current
    const diff = touchStart.current - end
    if (Math.abs(diff) > 45) go(diff > 0 ? 1 : -1)
    touchStart.current = null
  }

  return <section className="highlightsSection" aria-label="Destaques da Paróquia">
    <div className="wrap">
      <div className="highlightsHeading">
        <div><span className="eyebrow dark">EM DESTAQUE</span><h2>Vida da nossa Paróquia</h2></div>
        <span className="highlightCount">{String(index + 1).padStart(2,'0')} / {String(slides.length).padStart(2,'0')}</span>
      </div>
      <div className="highlightCarousel" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="highlightTrack" style={{transform:`translateX(-${index * 100}%)`}}>
          {slides.map((item, i) => {
            const image = item.image_url
            const mobile = item.mobile_image_url || image
            const complete = item.display_type === 'complete'
            return <article key={item.id} className={`highlightSlide ${complete ? 'completeArt' : 'editorialArt'}`} aria-hidden={i !== index}>
              <picture>
                {mobile && <source media="(max-width: 780px)" srcSet={mobile}/>} 
                {image && <img src={image} alt={item.image_alt || item.title || 'Destaque da Paróquia'}/>} 
              </picture>
              {!complete && <div className="highlightShade"/>}
              {!complete && <div className="highlightContent">
                {item.category && <span>{item.category}</span>}
                {item.title && <h3>{item.title}</h3>}
                {item.summary && <p>{item.summary}</p>}
                {item.button_label && item.button_url && <a href={item.button_url}>{item.button_label}</a>}
              </div>}
              {complete && item.button_url && <a className="highlightFullLink" href={item.button_url} aria-label={item.button_label || item.title || 'Abrir destaque'} />}
            </article>
          })}
        </div>
        {slides.length > 1 && <>
          <button type="button" className="highlightArrow prev" onClick={()=>go(-1)} aria-label="Destaque anterior">‹</button>
          <button type="button" className="highlightArrow next" onClick={()=>go(1)} aria-label="Próximo destaque">›</button>
          <div className="highlightDots" aria-label="Selecionar destaque">
            {slides.map((x,i)=><button key={x.id} type="button" className={i===index?'active':''} onClick={()=>setIndex(i)} aria-label={`Ir para destaque ${i+1}`}/>) }
          </div>
        </>}
      </div>
    </div>
  </section>
}
