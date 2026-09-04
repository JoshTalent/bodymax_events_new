import { cn } from '../utils/cn'

export function Spinner({ className }) {
  return (
    <div
      className={cn(
        'inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600',
        className
      )}
    />
  )
}

export function Loading({ className, label = 'Loading...' }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-slate-500', className)}>
      <Spinner />
      <p className="text-sm">{label}</p>
    </div>
  )
}

export function Empty({ title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <p className="text-lg font-semibold text-slate-700">{title}</p>
      {message && <p className="max-w-sm text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
