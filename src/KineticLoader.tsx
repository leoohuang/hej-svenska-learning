import { Sparkles } from 'lucide-react'

type Props = {
  eyebrow: string
  title: string
  description: string
  progress: number
  activity: string
  detail: string
  meta?: string[]
  letters?: string[]
}

export default function KineticLoader({
  eyebrow, title, description, progress, activity, detail, meta = [], letters = ['A', 'B', 'C'],
}: Props) {
  return (
    <section className="kinetic-loader">
      <div className="kinetic-lettermark" aria-hidden="true">
        {letters.slice(0, 3).map((letter) => <span key={letter}>{letter}</span>)}
        <div><i /><i /><i /><i /><i /></div>
      </div>
      <p className="section-kicker">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="kinetic-loader-copy">{description}</p>
      <div className="kinetic-progress" aria-label={`${progress}%`}>
        <div><i style={{ width: `${progress}%` }} /></div><span>{progress}%</span>
      </div>
      <div className="kinetic-activity">
        <span><Sparkles size={16} /></span>
        <div><strong>{activity}</strong><small>{detail}</small></div>
      </div>
      {meta.length > 0 && <footer>{meta.map((item, index) => <span key={item}>{index > 0 && <i />}{item}</span>)}</footer>}
    </section>
  )
}
