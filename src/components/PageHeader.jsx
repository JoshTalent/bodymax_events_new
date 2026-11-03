import { cn } from '../utils/cn.js'

export function PageHeader({ eyebrow, title, description, actions, children, className }) {
  return (
    <div className={cn('mb-6 flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-600">
            <span className="h-1 w-1 rounded-full bg-brand-500" />
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export default PageHeader
