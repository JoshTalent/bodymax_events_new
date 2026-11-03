import { cn } from '../utils/cn'

const base =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10'

export function Input({ label, error, className, id, ...props }) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-xs font-bold text-slate-600">
          {label}
        </label>
      )}
      <input id={id} className={cn(base, error && 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/10', className)} {...props} />
      {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  )
}

export function Select({ label, error, className, id, children, ...props }) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-xs font-bold text-slate-600">
          {label}
        </label>
      )}
      <select id={id} className={cn(base, 'pr-8', error && 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/10', className)} {...props}>
        {children}
      </select>
      {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  )
}

export function Textarea({ label, error, className, id, ...props }) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-xs font-bold text-slate-600">
          {label}
        </label>
      )}
      <textarea id={id} className={cn(base, error && 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/10', className)} {...props} />
      {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  )
}
