import { useId, useState } from 'react'
import { cn } from '../utils/cn.js'

function smoothPath(points) {
  if (!points.length) return ''
  return points.reduce((acc, p, i, arr) => {
    if (i === 0) return `M ${p[0]} ${p[1]}`
    const prev = arr[i - 1]
    const cx = (prev[0] + p[0]) / 2
    return `${acc} C ${cx} ${prev[1]}, ${cx} ${p[1]}, ${p[0]} ${p[1]}`
  }, '')
}

export function TrendChip({ value, suffix = '%', className, invert = false }) {
  if (value == null || Number.isNaN(value)) return null
  const positive = invert ? value < 0 : value >= 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold',
        positive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
        className
      )}
    >
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={cn('h-3 w-3', value < 0 && 'rotate-180')}>
        <path d="M4 13l4-4 3 3 5-5M12 7h4v4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {value > 0 ? '+' : ''}
      {Math.round(value)}
      {suffix}
    </span>
  )
}

export function Sparkline({ values = [], color = '#2563eb', className }) {
  const W = 120
  const H = 38
  const pad = 3
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const span = max - min || 1
  const pts = values.map((v, i) => [
    pad + (i * (W - pad * 2)) / Math.max(values.length - 1, 1),
    H - pad - ((v - min) / span) * (H - pad * 2),
  ])
  const line = smoothPath(pts)
  const area = `${line} L ${pts[pts.length - 1]?.[0] ?? W - pad} ${H - pad} L ${pts[0]?.[0] ?? pad} ${H - pad} Z`
  const gid = useId().replace(/:/g, '')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn('h-9 w-full', className)} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {values.length > 1 && <path d={area} fill={`url(#${gid})`} />}
      {values.length > 1 && <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />}
      {values.length > 0 && <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.4" fill={color} />}
    </svg>
  )
}

export function AreaChart({
  values = [],
  labels = [],
  height = 240,
  color = '#2563eb',
  valueSuffix = '',
  className,
}) {
  const gid = useId().replace(/:/g, '')
  const [hover, setHover] = useState(null)
  const W = 640
  const H = 260
  const pad = { top: 18, right: 18, bottom: 34, left: 44 }
  const innerW = W - pad.left - pad.right
  const innerH = H - pad.top - pad.bottom
  const max = Math.max(...values, 1)
  const niceMax = Math.max(4, Math.ceil(max / 4) * 4)
  const x = (i) => pad.left + (values.length <= 1 ? innerW / 2 : (i * innerW) / (values.length - 1))
  const y = (v) => pad.top + innerH - (v / niceMax) * innerH
  const pts = values.map((v, i) => [x(i), y(v)])
  const line = smoothPath(pts)
  const area = values.length ? `${line} L ${pts[pts.length - 1][0]} ${pad.top + innerH} L ${pts[0][0]} ${pad.top + innerH} Z` : ''

  const onMove = (e) => {
    if (!values.length) return
    const rect = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * W
    const idx = Math.round(((px - pad.left) / innerW) * (values.length - 1))
    setHover(Math.min(values.length - 1, Math.max(0, idx)))
  }

  const grid = Array.from({ length: 5 }, (_, i) => Math.round((niceMax / 4) * i))
  const hoverX = hover != null ? x(hover) : 0
  const hoverY = hover != null ? y(values[hover] || 0) : 0

  return (
    <div className={cn('relative w-full select-none', className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="none"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label="Registration activity chart"
      >
        <defs>
          <linearGradient id={`area-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="70%" stopColor={color} stopOpacity="0.06" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`stroke-${gid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="55%" stopColor={color} />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>

        {grid.map((g) => {
          const gy = pad.top + innerH - (g / niceMax) * innerH
          return (
            <g key={g}>
              <line x1={pad.left} x2={W - pad.right} y1={gy} y2={gy} stroke="#e2e8f0" strokeDasharray="3 5" strokeWidth="1" />
              <text x={pad.left - 10} y={gy + 3.5} textAnchor="end" fontSize="10" fill="#94a3b8" fontWeight="600">
                {g}
              </text>
            </g>
          )
        })}

        {values.length > 1 && <path d={area} fill={`url(#area-${gid})`} />}
        {values.length > 1 && (
          <path d={line} fill="none" stroke={`url(#stroke-${gid})`} strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" />
        )}

        {labels.map((l, i) => (
          <text key={`${l}-${i}`} x={x(i)} y={H - 10} textAnchor="middle" fontSize="10" fill="#94a3b8" fontWeight="600">
            {l}
          </text>
        ))}

        {hover != null && (
          <g>
            <line x1={hoverX} x2={hoverX} y1={pad.top} y2={pad.top + innerH} stroke={color} strokeOpacity="0.3" strokeDasharray="3 3" />
            <circle cx={hoverX} cy={hoverY} r="8" fill={color} fillOpacity="0.12" />
            <circle cx={hoverX} cy={hoverY} r="3.5" fill="white" stroke={color} strokeWidth="2.5" />
          </g>
        )}
      </svg>

      {hover != null && (
        <div
          className="pointer-events-none absolute top-2 z-10 -translate-x-1/2 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur"
          style={{ left: `${(hoverX / W) * 100}%` }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{labels[hover]}</p>
          <p className="text-sm font-bold text-slate-900">
            {values[hover]}
            <span className="ml-0.5 text-xs font-medium text-slate-500">{valueSuffix}</span>
          </p>
        </div>
      )}
    </div>
  )
}

export function DonutChart({ data = [], size = 180, thickness = 16, centerLabel = 'Total', centerValue, className }) {
  const total = data.reduce((s, d) => s + (d.value || 0), 0)
  const r = (size - thickness) / 2
  const circ = 2 * Math.PI * r
  let offset = 0

  return (
    <div className={cn('relative inline-flex shrink-0 items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef2f7" strokeWidth={thickness} />
        {total > 0 &&
          data.map((d) => {
            const len = ((d.value || 0) / total) * circ
            const seg = (
              <circle
                key={d.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={d.color}
                strokeWidth={thickness}
                strokeDasharray={`${Math.max(len - 3, 0)} ${circ - Math.max(len - 3, 0)}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
              />
            )
            offset += len
            return seg
          })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black tracking-tight text-slate-900">{centerValue ?? total}</span>
        <span className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">{centerLabel}</span>
      </div>
    </div>
  )
}

export function BarList({ data = [], className, color = '#2563eb', valueSuffix = '' }) {
  const max = Math.max(...data.map((d) => d.value || 0), 1)
  return (
    <div className={cn('space-y-3.5', className)}>
      {data.map((d, i) => (
        <div key={d.label}>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 truncate text-xs font-semibold text-slate-600">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-500">
                {i + 1}
              </span>
              <span className="truncate">{d.label}</span>
            </span>
            <span className="shrink-0 text-xs font-bold text-slate-900">
              {d.value}
              {valueSuffix}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.max(((d.value || 0) / max) * 100, d.value ? 4 : 0)}%`,
                background: d.color || `linear-gradient(90deg, ${color}b3, ${color})`,
              }}
            />
          </div>
        </div>
      ))}
      {data.length === 0 && <p className="py-6 text-center text-xs text-slate-400">No data yet</p>}
    </div>
  )
}

export function RadialProgress({ value = 0, size = 132, stroke = 11, color = '#2563eb', label, sublabel, className }) {
  const clamped = Math.max(0, Math.min(100, value))
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef2f7" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(clamped / 100) * circ} ${circ}`}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black tracking-tight text-slate-900">{Math.round(clamped)}%</span>
        {label && <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>}
        {sublabel && <span className="mt-0.5 text-[10px] font-medium text-slate-400">{sublabel}</span>}
      </div>
    </div>
  )
}
