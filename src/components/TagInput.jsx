import { useState } from 'react'
import { Button } from './Button.jsx'

export default function TagInput({ label, placeholder, values, setValues }) {
  const [text, setText] = useState('')
  const add = () => {
    const v = text.trim()
    if (v && !values.includes(v)) {
      setValues([...values, v])
      setText('')
    }
  }
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        <Button type="button" variant="secondary" onClick={add}>Add</Button>
      </div>
      {values.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {values.map((v) => (
            <span key={v} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
              {v}
              <button type="button" onClick={() => setValues(values.filter((x) => x !== v))} className="text-slate-400 hover:text-slate-900">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}