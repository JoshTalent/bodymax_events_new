import { Link } from 'react-router-dom'
import { cn } from '../utils/cn.js'
import { TrendChip, Sparkline } from './Charts.jsx'

const TONES = {
  brand: {
    icon: 'bg-brand-50 text-brand-600 ring-brand-100',
    bar: 'from-brand-500 to-indigo-500',
    spark: '#2563eb',
  },
  emerald: {
    icon: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    bar: 'from-emerald-400 to-teal-500',
    spark: '#059669',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-600 ring-amber-100',
    bar: 'from-amber-400 to-orange-500',
    spark: '#d97706',
  },
  violet: {
    icon: 'bg-violet-50 text-violet-600 ring-violet-100',
    bar: 'from-violet-500 to-purple-500',
    spark: '#7c3aed',
  },
  slate: {
    icon: 'bg-slate-100 text-slate-600 ring-slate-200',
    bar: 'from-slate-500 to-slate-700',
    spark: '#475569',
  },
}

export function StatCard({ label, value, sub, icon, tone = 'brand', trend, spark, to, className, emphasis = false }) {
  const t = TONES[tone] || TONES.brand
  const inner = (
    <div
      className={cn(
        'group relative h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition duration-300',
        'hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_40px_-24px_rgba(15,23,42,0.35)]',
        emphasis && 'border-amber-200 bg-gradient-to-br from-amber-50/80 to-white',
        className
      )}
    >
      <span className={cn('absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r opacity-80', t.bar)} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
          <p className="mt-2 text-[32px] font-black leading-none tracking-tight text-slate-900">{value}</p>
        </div>
        {icon && (
          <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1', t.icon)}>
            {icon}
          </span>
        )}
      </div>

      <div className="mt-3 flex min-h-[24px] items-end justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {trend != null && <TrendChip value={trend} />}
          {sub && <p className="truncate text-xs font-medium text-slate-500">{sub}</p>}
        </div>
        {spark?.length > 1 && <Sparkline values={spark} color={t.spark} className="w-20 shrink-0 opacity-90" />}
      </div>
    </div>
  )

  if (to) {
    return (
      <Link to={to} className="block h-full rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2">
        {inner}
      </Link>
    )
  }
  return inner
}

export default StatCard
