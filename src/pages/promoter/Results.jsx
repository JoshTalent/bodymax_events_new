import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../utils/api.js'
import { useToast } from '../../context/ToastContext.jsx'
import { Button } from '../../components/Button.jsx'
import { Card } from '../../components/Card.jsx'
import { Loading, Empty, Spinner } from '../../components/Loading.jsx'
import { Modal } from '../../components/Modal.jsx'
import { Select, Input, Textarea } from '../../components/Field.jsx'
import { cn } from '../../utils/cn.js'

const methods = ['Decision', 'KO', 'TKO', 'RSC', 'Disqualification', 'Walkover', 'Other']

const STATUS_PILLS = {
  scheduled: { label: 'Scheduled', cls: 'bg-blue-50 text-blue-700 ring-blue-600/20', dot: 'bg-blue-500' },
  ready: { label: 'Ready', cls: 'bg-blue-50 text-blue-700 ring-blue-600/20', dot: 'bg-blue-500' },
  in_progress: { label: 'In Progress', cls: 'bg-amber-50 text-amber-700 ring-amber-600/20', dot: 'bg-amber-500 animate-pulse' },
  walkover: { label: 'Walkover', cls: 'bg-amber-50 text-amber-700 ring-amber-600/20', dot: 'bg-amber-500' },
  completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  postponed: { label: 'Postponed', cls: 'bg-slate-100 text-slate-600 ring-slate-400/20', dot: 'bg-slate-400' },
  cancelled: { label: 'Cancelled', cls: 'bg-slate-100 text-slate-600 ring-slate-400/20', dot: 'bg-slate-400' },
}

const METHOD_STYLES = {
  Decision: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  KO: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  TKO: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  RSC: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Disqualification: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  Walkover: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Other: 'bg-slate-100 text-slate-600 ring-slate-500/20',
}

function StatusPill({ status }) {
  const s = STATUS_PILLS[status] || { label: status.replace('_', ' '), cls: 'bg-slate-100 text-slate-600 ring-slate-400/20', dot: 'bg-slate-400' }
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1', s.cls)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  )
}

function MethodChip({ method }) {
  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1', METHOD_STYLES[method] || METHOD_STYLES.Other)}>
      {method || 'Decision'}
    </span>
  )
}

function initials(name) {
  return (name || '—').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

function Corner({ corner, reg, winner }) {
  const name = reg?.boxerId?.fullName
  const club = reg?.boxerId?.clubName || reg?.clubId?.name
  const isRed = corner === 'red'
  const cornerBase = isRed
    ? { label: 'Red Corner', avatar: 'bg-red-600 text-white', border: 'border-red-200' }
    : { label: 'Blue Corner', avatar: 'bg-blue-600 text-white', border: 'border-blue-200' }

  return (
    <div className={cn(
      'flex flex-1 items-center gap-3 rounded-xl border px-3 py-3 transition',
      winner ? 'border-emerald-300 bg-emerald-50 shadow-sm' : cn('bg-white', cornerBase.border)
    )}>
      <span className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm',
        winner ? 'bg-emerald-600 text-white' : cornerBase.avatar
      )}>
        {initials(name)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">{cornerBase.label}</span>
        <span className="block truncate font-semibold text-slate-900">
          {name || <span className="italic text-slate-400">Bye</span>}
        </span>
        <span className="block truncate text-xs text-slate-500">{club || 'Guest'}</span>
      </span>
      {winner && (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M12 3a1 1 0 011 1v1.05A7.002 7.002 0 0119 12a7 7 0 01-6 6.94V21h3.5a1 1 0 110 2h-9a1 1 0 110-2H11v-2.06A7 7 0 015 12a7.002 7.002 0 016-6.94V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Winner
        </span>
      )}
    </div>
  )
}

function StatTile({ label, value, tone }) {
  const tones = {
    slate: 'text-white',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    blue: 'text-brand-400',
  }
  return (
    <div className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15 backdrop-blur">
      <p className={cn('text-2xl font-black leading-none', tones[tone])}>{value}</p>
      <p className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-300">{label}</p>
    </div>
  )
}

export default function Results() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [event, setEvent] = useState(null)
  const [bouts, setBouts] = useState(null)
  const [recordBout, setRecordBout] = useState(null)
  const [form, setForm] = useState({ winnerId: '', method: 'Decision', round: '', notes: '' })
  const [busy, setBusy] = useState(false)

  const load = () => {
    api(`/events?id=${id}`).then((d) => setEvent(d.event)).catch(() => {})
    api(`/bouts?eventId=${id}`).then((d) => setBouts(d.bouts)).catch(() => setBouts([]))
  }
  useEffect(load, [id])

  const openRecord = (b) => {
    setRecordBout(b)
    setForm({ winnerId: '', method: 'Decision', round: '', notes: '' })
  }

  const submit = async () => {
    if (!form.winnerId) return
    setBusy(true)
    try {
      await api(`/results/record?id=${recordBout._id}`, {
        method: 'POST',
        body: { ...form, round: form.round ? Number(form.round) : null },
      })
      toast(`Result recorded for Bout #${recordBout.boutNumber}`)
      setRecordBout(null)
      load()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  if (!event) return <Loading />

  const ordered = bouts ? [...bouts].sort((a, b) => a.boutNumber - b.boutNumber) : []
  const completed = ordered.filter((b) => b.status === 'completed').length
  const walkovers = ordered.filter((b) => b.status === 'walkover').length
  const pending = ordered.length - completed - walkovers
  const decided = completed + walkovers
  const hasResults = decided > 0
  const pct = ordered.length ? Math.round((decided / ordered.length) * 100) : 0
  const compPct = ordered.length ? (completed / ordered.length) * 100 : 0
  const woPct = ordered.length ? (walkovers / ordered.length) * 100 : 0

  const eventMeta = [
    event.eventDate && new Date(event.eventDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    event.venue,
    event.location,
  ].filter(Boolean).join(' · ')

  const downloadPdf = async () => {
    try {
      await buildPdf()
    } catch (err) {
      console.error('PDF generation failed', err)
      toast(String(err?.message || err), 'error')
    }
  }

  const buildPdf = async () => {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })

    const slate = [15, 23, 42]
    const red = [220, 38, 38]
    const emerald = [5, 150, 105]
    const amber = [180, 83, 9]
    const gray = [100, 116, 139]
    const ink = [30, 41, 59]
    const line = [226, 232, 240]
    const light = [248, 250, 252]

    const pageW = doc.internal.pageSize.getWidth()
    const M = 14

    // Branded header band
    doc.setFillColor(...slate)
    doc.rect(0, 0, pageW, 30, 'F')
    doc.setFillColor(...red)
    doc.rect(0, 30, pageW, 1.2, 'F')

    doc.setTextColor(255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text('BODYMAX', M, 15)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(148, 163, 184)
    doc.text('BOXING · LIVE EVENT MANAGEMENT', M, 21)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(255)
    doc.text('OFFICIAL EVENT RESULTS', pageW - M, 14, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(148, 163, 184)
    doc.text(
      `Generated ${new Date().toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
      pageW - M,
      20,
      { align: 'right' }
    )

    // Event info block
    let y = 42
    doc.setTextColor(...slate)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.text(event.name || 'Event', M, y)
    y += 6.5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...gray)
    doc.text(eventMeta || '—', M, y)
    y += 4

    // Summary tiles
    const stats = [
      { label: 'Total Bouts', value: ordered.length },
      { label: 'Completed', value: completed },
      { label: 'Walkovers', value: walkovers },
      { label: 'Pending', value: pending },
    ]
    const tileW = (pageW - 2 * M - 3 * 4) / 4
    stats.forEach((s, i) => {
      const x = M + i * (tileW + 4)
      doc.setFillColor(...light)
      doc.setDrawColor(...line)
      doc.roundedRect(x, y, tileW, 12, 1.5, 1.5, 'FD')
      doc.setTextColor(...slate)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text(String(s.value), x + 3, y + 5.5)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.5)
      doc.setTextColor(...gray)
      doc.text(s.label.toUpperCase(), x + 3, y + 9.5)
    })
    y += 12 + 7

    const rows = []
    const rowMeta = []
    ordered.forEach((b) => {
      const a = b.boxerAId?.boxerId?.fullName || 'Bye'
      const bb = b.boxerBId?.boxerId?.fullName || 'Bye'
      const winnerId = b.winnerId ? String(b.winnerId._id || b.winnerId) : null
      const aWin = b.status === 'completed' && b.boxerAId && String(b.boxerAId._id) === winnerId
      const bWin = b.status === 'completed' && b.boxerBId && String(b.boxerBId._id) === winnerId
      const result = b.status === 'completed'
        ? `${b.winnerId?.boxerId?.fullName || '—'} · ${b.result?.method || 'Decision'}${b.result?.round ? ` · R${b.result.round}` : ''}`
        : b.status === 'walkover'
          ? `Walkover · ${b.winnerId?.boxerId?.fullName || '—'}`
          : 'Pending'
      rows.push([`#${b.boutNumber}`, aWin ? `W  ${a}` : a, bWin ? `W  ${bb}` : bb, result])
      rowMeta.push({ status: b.status, aWin, bWin })
    })

    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [['BOUT', 'RED CORNER · BOXER A', 'BLUE CORNER · BOXER B', 'RESULT']],
      body: rows,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2.6, textColor: ink, lineColor: line, lineWidth: 0.25 },
      headStyles: { fillColor: slate, textColor: 255, fontStyle: 'bold', fontSize: 7.5, halign: 'left' },
      alternateRowStyles: { fillColor: light },
      columnStyles: {
        0: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 50 },
        2: { cellWidth: 50 },
        3: { cellWidth: 66 },
      },
      didParseCell: (data) => {
        if (data.section !== 'body') return
        const meta = rowMeta[data.row.index]
        if (!meta) return
        if (data.column.index === 3) {
          data.cell.styles.textColor = meta.status === 'completed' ? emerald : meta.status === 'walkover' ? amber : gray
          if (meta.status === 'completed') data.cell.styles.fontStyle = 'bold'
        }
        if (data.column.index === 1 || data.column.index === 2) {
          const isWinner = data.column.index === 1 ? meta.aWin : meta.bWin
          if (isWinner) {
            data.cell.styles.textColor = emerald
            data.cell.styles.fontStyle = 'bold'
          }
        }
      },
    })

    const finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || y

    if (pending > 0) {
      doc.setFontSize(8)
      doc.setTextColor(...amber)
      doc.text(`${pending} bout${pending === 1 ? '' : 's'} still pending — results will appear once recorded.`, M, finalY + 6)
    }

    // Footer with page numbers
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      const h = doc.internal.pageSize.getHeight()
      doc.setDrawColor(...line)
      doc.line(M, h - 12, pageW - M, h - 12)
      doc.setFontSize(7)
      doc.setTextColor(...gray)
      doc.text('Generated by Bodymax · Live event management', M, h - 7)
      doc.text(`Page ${i} of ${pageCount}`, pageW - M, h - 7, { align: 'right' })
    }

    const safeName = (event.name || 'event').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase()
    doc.save(`results-${safeName}.pdf`)
  }

  return (
    <div>
      {/* Hero header */}
      <button onClick={() => navigate(`/app/events/${id}`)} className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-brand-600 transition hover:text-brand-700 hover:underline">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        Back to Event
      </button>

      <div className="overflow-hidden rounded-3xl bg-slate-950 shadow-xl">
        <div className="bg-[radial-gradient(70%_120%_at_100%_0%,rgba(37,99,235,0.28),transparent),radial-gradient(50%_100%_at_0%_100%,rgba(220,38,38,0.18),transparent)] px-6 py-7 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-400">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                Results
              </p>
              <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{event.name}</h1>
              <p className="mt-1 text-sm text-slate-400">{eventMeta || '—'}</p>
            </div>

            <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:grid-cols-4">
              <StatTile label="Total Bouts" value={ordered.length} tone="slate" />
              <StatTile label="Completed" value={completed} tone="emerald" />
              <StatTile label="Walkovers" value={walkovers} tone="amber" />
              <StatTile label="Pending" value={pending} tone="blue" />
            </div>
          </div>

          {/* Progress */}
          <div className="mt-7 border-t border-white/10 pt-5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold uppercase tracking-widest text-slate-400">Card Progress</span>
              <span className="font-semibold text-white">
                {decided} of {ordered.length} bouts decided
                <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold text-brand-300">{pct}%</span>
              </span>
            </div>
            <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${compPct}%` }} />
              <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${woPct}%` }} />
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Completed</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" /> Walkover</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-white/20" /> Pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {hasResults
            ? `${decided} bout${decided === 1 ? '' : 's'} decided` + (pending > 0 ? ` · ${pending} still awaiting a result` : ' · all results recorded')
            : 'No results recorded yet'}
        </p>
        {ordered.length > 0 && (
          <Button variant="secondary" onClick={downloadPdf} disabled={!hasResults}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download PDF
          </Button>
        )}
      </div>

      {!bouts ? (
        <div className="mt-5"><Loading /></div>
      ) : ordered.length === 0 ? (
        <div className="mt-5">
          <Card>
            <Empty title="No bouts yet" message="Create a draw first — results are recorded per bout." action={<Button onClick={() => navigate(`/app/events/${id}/draws`)}>Go to Draws</Button>} />
          </Card>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {ordered.map((b, i) => {
            const a = b.boxerAId
            const bb = b.boxerBId
            const winnerId = b.winnerId ? String(b.winnerId._id || b.winnerId) : null
            const aWin = winnerId && a && String(a._id) === winnerId
            const bWin = winnerId && bb && String(bb._id) === winnerId
            const isWalkover = b.status === 'walkover'
            const isRecorded = b.status === 'completed' || isWalkover
            const winnerName = aWin ? a?.boxerId?.fullName : bWin ? bb?.boxerId?.fullName : b.winnerId?.boxerId?.fullName

            return (
              <article key={b._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* Bout header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white shadow-sm">{i + 1}</span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bout #{b.boutNumber}</p>
                      <p className="text-xs text-slate-500">
                        <span className="font-medium text-slate-600">{b.category?.weight || 'All weights'}</span>
                        {b.category?.age ? ` · ${b.category.age}` : ''}
                        {b.category?.gender ? ` · ${b.category.gender}` : ''}
                        {b.ring ? ` · ${b.ring}` : ''}
                        {b.scheduledTime ? ` · ${b.scheduledTime}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isWalkover && <MethodChip method="Walkover" />}
                    {b.status === 'completed' && <MethodChip method={b.result?.method} />}
                    <StatusPill status={b.status} />
                    {a && bb && !isRecorded && (
                      <Button size="sm" onClick={() => openRecord(b)}>Record Result</Button>
                    )}
                  </div>
                </div>

                {/* Matchup */}
                <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-stretch sm:gap-3">
                  <Corner corner="red" reg={a} winner={aWin} />
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center self-center rounded-full bg-slate-900 text-[10px] font-black tracking-wide text-white shadow-lg ring-4 ring-slate-100">
                    VS
                  </span>
                  <Corner corner="blue" reg={bb} winner={bWin} />
                </div>

                {/* Result banner */}
                {b.status === 'completed' && (
                  <div className="flex items-start gap-3 border-t border-emerald-200/60 bg-emerald-50 px-5 py-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <p className="text-sm text-emerald-900">
                      <span className="font-bold">{winnerName}</span> wins by <span className="font-semibold">{b.result?.method || 'Decision'}</span>
                      {b.result?.round ? <span className="font-semibold"> in round {b.result.round}</span> : ''}
                      {b.result?.notes && <span className="mt-0.5 block text-xs text-emerald-700">{b.result.notes}</span>}
                    </p>
                  </div>
                )}
                {isWalkover && (
                  <div className="flex items-start gap-3 border-t border-amber-200/60 bg-amber-50 px-5 py-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                    </span>
                    <p className="text-sm text-amber-900">
                      <span className="font-bold">{winnerName || (aWin ? a?.boxerId?.fullName : bb?.boxerId?.fullName)}</span> advances by walkover without a contest.
                      {b.result?.notes && <span className="mt-0.5 block text-xs text-amber-700">{b.result.notes}</span>}
                    </p>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      <Modal
        open={!!recordBout}
        onClose={() => setRecordBout(null)}
        title={`Record Result — Bout #${recordBout?.boutNumber || ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRecordBout(null)}>Cancel</Button>
            <Button onClick={submit} disabled={busy || !form.winnerId}>
              {busy ? <Spinner className="h-4 w-4 border-white" /> : 'Confirm Result'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select label="Winner" value={form.winnerId} onChange={(e) => setForm({ ...form, winnerId: e.target.value })}>
            <option value="">Select winner</option>
            {recordBout?.boxerAId && <option value={recordBout.boxerAId._id}>{recordBout.boxerAId.boxerId?.fullName}</option>}
            {recordBout?.boxerBId && <option value={recordBout.boxerBId._id}>{recordBout.boxerBId.boxerId?.fullName}</option>}
          </Select>
          <Select label="Method of Victory" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
            {methods.map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
          <Input label="Round Finished" type="number" value={form.round} onChange={(e) => setForm({ ...form, round: e.target.value })} placeholder="Optional" />
          <Textarea label="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
        </div>
      </Modal>
    </div>
  )
}