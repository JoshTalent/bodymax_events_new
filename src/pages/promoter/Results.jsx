import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../../utils/api.js'
import { useToast } from '../../context/ToastContext.jsx'
import { Button } from '../../components/Button.jsx'
import { Card } from '../../components/Card.jsx'
import { Loading, Empty, Spinner } from '../../components/Loading.jsx'
import { Modal } from '../../components/Modal.jsx'
import { Select, Input, Textarea } from '../../components/Field.jsx'
import { Icon } from '../../components/Icons.jsx'
import { cn } from '../../utils/cn.js'

const AMATEUR_METHODS = ['Decision', 'KO', 'TKO', 'RSC', 'Disqualification', 'Walkover', 'Other']
const PRO_METHODS = [
  'Unanimous Decision',
  'Split Decision',
  'Majority Decision',
  'KO',
  'TKO',
  'RTD',
  'Disqualification',
  'No Contest',
  'Walkover',
  'Technical Decision',
  'Technical Draw',
]

const STATUS_PILLS = {
  scheduled: { label: 'SCHEDULED', cls: 'bg-slate-50 text-slate-600 ring-slate-200', dot: 'bg-slate-400' },
  ready: { label: 'READY', cls: 'bg-blue-50 text-blue-700 ring-blue-600/20', dot: 'bg-blue-500' },
  in_progress: { label: 'LIVE', cls: 'bg-rose-50 text-rose-700 ring-rose-600/20', dot: 'bg-rose-500', pulse: true },
  completed: { label: 'FINISHED', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  walkover: { label: 'WALKOVER', cls: 'bg-amber-50 text-amber-700 ring-amber-600/20', dot: 'bg-amber-500' },
  postponed: { label: 'POSTPONED', cls: 'bg-orange-50 text-orange-700 ring-orange-600/20', dot: 'bg-orange-500' },
  cancelled: { label: 'CANCELLED', cls: 'bg-slate-100 text-slate-600 ring-slate-400', dot: 'bg-slate-400' },
}

function StatusPill({ status }) {
  const p = STATUS_PILLS[status] || STATUS_PILLS.scheduled
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset', p.cls)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', p.dot, p.pulse ? 'animate-pulse' : '')} />
      {p.label}
    </span>
  )
}

function MethodChip({ method }) {
  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset border-transparent', 'bg-slate-100 text-slate-600')}>
      {method || 'Decision'}
    </span>
  )
}

export default function Results() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [event, setEvent] = useState(null)
  const [bouts, setBouts] = useState(null)
  const [recordBout, setRecordBout] = useState(null)
  const [form, setForm] = useState({
    winnerId: '',
    method: 'Decision',
    proMethod: '',
    round: '',
    knockdownsA: '',
    knockdownsB: '',
    titleChanged: false,
    scorecards: [
      { judgeName: 'Judge 1', boxerAScore: null, boxerBScore: null, boxerARounds: [], boxerBRounds: [] },
      { judgeName: 'Judge 2', boxerAScore: null, boxerBScore: null, boxerARounds: [], boxerBRounds: [] },
      { judgeName: 'Judge 3', boxerAScore: null, boxerBScore: null, boxerARounds: [], boxerBRounds: [] },
    ],
    notes: '',
  })
  const [busy, setBusy] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareEmail, setShareEmail] = useState('')
  const [shareMessage, setShareMessage] = useState('')
  const [shareBusy, setShareBusy] = useState(false)
  const [shareError, setShareError] = useState('')

  const load = () => {
    api(`/events?id=${id}`).then((d) => setEvent(d.event)).catch(() => {})
    api(`/bouts?eventId=${id}`).then((d) => setBouts(d.bouts)).catch(() => setBouts([]))
  }
  useEffect(load, [id])

  const isPro = event?.eventType === 'professional'

  const openRecord = (b) => {
    setRecordBout(b)
    const existing = b.result || {}
    const existingCards = Array.isArray(existing.scorecards) && existing.scorecards.length
      ? existing.scorecards
      : [
          { judgeName: 'Judge 1', boxerAScore: null, boxerBScore: null, boxerARounds: [], boxerBRounds: [] },
          { judgeName: 'Judge 2', boxerAScore: null, boxerBScore: null, boxerARounds: [], boxerBRounds: [] },
          { judgeName: 'Judge 3', boxerAScore: null, boxerBScore: null, boxerARounds: [], boxerBRounds: [] },
        ]
    setForm({
      winnerId: existing.winnerId || '',
      method: existing.method || 'Decision',
      proMethod: existing.proMethod || existing.method || '',
      round: existing.round ?? '',
      knockdownsA: existing.knockdownsA ?? '',
      knockdownsB: existing.knockdownsB ?? '',
      titleChanged: existing.titleChanged ?? false,
      scorecards: existingCards.map((s) => ({
        judgeName: s.judgeName || 'Judge',
        boxerAScore: s.boxerAScore ?? null,
        boxerBScore: s.boxerBScore ?? null,
        boxerARounds: Array.isArray(s.boxerARounds) ? [...s.boxerARounds] : [],
        boxerBRounds: Array.isArray(s.boxerBRounds) ? [...s.boxerBRounds] : [],
      })),
      notes: existing.notes || '',
    })
  }

  const isDecision = (m) => /^Unanimous|Split|Majority|Technical Decision$/i.test(m || '')
  const isProDecision = isPro && isDecision(form.proMethod || form.method)

  const submit = async () => {
    if (!form.winnerId) return
    setBusy(true)
    try {
      await api(`/results/record?id=${recordBout._id}`, {
        method: 'POST',
        body: {
          winnerId: form.winnerId,
          method: form.method,
          proMethod: isPro ? form.proMethod : undefined,
          round: form.round ? Number(form.round) : null,
          knockdownsA: isPro ? (form.knockdownsA ? Number(form.knockdownsA) : 0) : undefined,
          knockdownsB: isPro ? (form.knockdownsB ? Number(form.knockdownsB) : 0) : undefined,
          titleChanged: isPro ? form.titleChanged : undefined,
          scorecards: isProDecision ? form.scorecards : undefined,
          notes: form.notes,
        },
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
  const hasBoxer = (b) => !!(b.boxerAId?.boxerId?.fullName) || !!(b.boxerBId?.boxerId?.fullName)
  const displayed = ordered.filter(hasBoxer)
  const hidden = ordered.length - displayed.length
  const completed = displayed.filter((b) => b.status === 'completed').length
  const walkovers = displayed.filter((b) => b.status === 'walkover').length
  const pending = displayed.length - completed - walkovers
  const decided = completed + walkovers
  const hasResults = decided > 0
  const pct = displayed.length ? Math.round((decided / displayed.length) * 100) : 0
  const compPct = displayed.length ? (completed / displayed.length) * 100 : 0
  const woPct = displayed.length ? (walkovers / displayed.length) * 100 : 0

  const eventMeta = [
    event.eventDate && new Date(event.eventDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    event.venue,
    event.location,
  ].filter(Boolean).join(' · ')

  const downloadPdf = async () => {
    try {
      const { doc, fileName } = await buildPdf()
      doc.save(fileName)
    } catch (err) {
      console.error('PDF generation failed', err)
      toast(String(err?.message || err), 'error')
    }
  }

  const sendShare = async () => {
    const target = shareEmail.trim()
    if (!target) {
      setShareError('Enter the recipient email')
      return
    }
    setShareBusy(true)
    setShareError('')
    try {
      const { doc, fileName } = await buildPdf()
      const pdfBase64 = doc.output('datauristring').split(',')[1] || ''
      await api('/share-results', {
        method: 'POST',
        body: { email: target, eventId: id, fileName, pdfBase64, message: shareMessage },
      })
      toast(`Results PDF sent to ${target}`)
      setShareOpen(false)
      setShareEmail('')
      setShareMessage('')
    } catch (err) {
      setShareError(String(err?.message || err))
    } finally {
      setShareBusy(false)
    }
  }

  const boxerDetails = (reg) => {
    if (!reg) return { gender: '', weight: '', age: '' }
    const boxer = reg.boxerId || {}
    const pro = boxer.professional || {}
    return {
      gender: boxer.gender === 'M' ? 'Male' : boxer.gender === 'F' ? 'Female' : '',
      weight: pro?.division || reg.category?.weight || boxer.weightCategory || '',
      age: pro?.division ? '' : reg.category?.age || boxer.ageCategory || '',
      record: boxer.professional?.record,
      country: pro?.country || boxer.nationality || '',
    }
  }

  const photoFor = (reg) => {
    if (!reg) return null
    const boxer = reg.boxerId || {}
    const pro = boxer.professional || {}
    return pro?.photos?.headshotUrl || boxer.photoUrl || null
  }

  const loadPhotoFor = async (url) => {
    if (!url) return null
    return loadPhoto(url)
  }

  const uniqueParts = (parts) => [...new Set(parts.filter(Boolean))]

  const genderLabel = (g) => (g === 'M' ? 'M' : g === 'F' ? 'F' : g)

  // PDF helpers
  const buildPdf = async () => {
    const { jsPDF } = await import('jspdf')
    const { autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const M = 14
    const ink = [15, 23, 42]
    const line = [226, 232, 240]

    // Header band
    doc.setFillColor(...ink)
    doc.rect(0, 0, pageW, 30, 'F')
    doc.setFillColor([202, 138, 4])
    doc.rect(0, 30, pageW, 1.4, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text('Official Results', 14, 13)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(203, 213, 225)
    doc.text(event?.name || 'Event', 14, 20)
    doc.text(eventMeta, 14, 25)
    doc.setFontSize(8)
    doc.text(`Generated ${new Date().toLocaleDateString('en-GB')}`, pageW - 14, 25, { align: 'right' })

    // Stats row
    const stats = [
      { label: 'Bouts', value: displayed.length },
      { label: 'Decided', value: decided, tone: 'emerald' },
      { label: 'Pending', value: pending, tone: pending > 0 ? 'amber' : 'emerald' },
      { label: 'Walkovers', value: walkovers, tone: 'amber' },
    ]
    const statW = (pageW - 28 - 3 * 4) / 4
    stats.forEach((s, i) => {
      const x = 14 + i * (statW + 4)
      doc.setFillColor(241, 245, 249)
      doc.roundedRect(x, 36, statW, 13, 2, 2, 'F')
      doc.setTextColor(100, 116, 139)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.5)
      doc.text(s.label.toUpperCase(), x + 3, 41)
      doc.setTextColor(...ink)
      doc.setFontSize(13)
      doc.text(String(s.value), x + 3, 47)
    })

    let y = 56
    if (hidden > 0) {
      doc.setTextColor(100, 116, 139)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.text(`${hidden} bout${hidden === 1 ? '' : 's'} without boxers are hidden from this card.`, M, y)
      y += 7
    }

    if (displayed.length === 0) {
      doc.setTextColor(100, 116, 139)
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(9)
      doc.text('No bouts to show.', M, y + 10)
    } else {
      // Table
      const head = [['BOUT', 'RED CORNER', 'BLUE CORNER', 'RESULT']]
      const body = displayed.map((b) => {
        const winnerId = b.winnerId ? String(b.winnerId._id || b.winnerId) : null
        const decided = b.status === 'completed' || b.status === 'walkover'
        const aWin = decided && b.boxerAId && String(b.boxerAId._id) === winnerId
        const bWin = decided && b.boxerBId && String(b.boxerBId._id) === winnerId
        const winnerName = aWin
          ? b.boxerAId?.boxerId?.fullName
          : bWin
            ? b.boxerBId?.boxerId?.fullName
            : b.winnerId?.boxerId?.fullName || ''
        const methodText = b.result?.proMethod || b.result?.method || (decided ? 'Decision' : '')
        const roundText = b.result?.round ? ` R${b.result.round}` : ''
        const kdText =
          (b.result?.knockdownsA || b.result?.knockdownsB) &&
          (b.result.knockdownsA || 0) + (b.result.knockdownsB || 0) > 0
            ? ` KD ${b.result.knockdownsA || 0}-${b.result.knockdownsB || 0}`
            : ''
        const titleText = b.titleFight ? ' TITLE' : ''
        const scoreText =
          isPro && b.result?.scorecards?.length
            ? ` | ${b.result.scorecards.map((s) => `${s.boxerAScore ?? '–'}-${s.boxerBScore ?? '–'}`).join(' / ')}`
            : ''
        return [
          `#${b.boutNumber}`,
          `${b.boxerAId?.boxerId?.professional?.ringName || b.boxerAId?.boxerId?.fullName || 'TBA'}`,
          `${b.boxerBId?.boxerId?.professional?.ringName || b.boxerBId?.boxerId?.fullName || 'TBA'}`,
          `${decided ? (winnerName || '') + ' wins' : 'Pending'}${methodText ? ` · ${methodText}` : ''}${roundText}${kdText}${titleText}${scoreText}`,
        ]
      })

      autoTable(doc, {
        startY: y,
        head,
        body,
        theme: 'grid',
        margin: { left: M, right: M, bottom: 24 },
        styles: {
          fontSize: 8,
          cellPadding: 2,
          textColor: ink,
          lineColor: line,
          lineWidth: 0.25,
          overflow: 'linebreak',
        },
        headStyles: { fillColor: ink, textColor: 255, fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 16 },
          1: { cellWidth: 52 },
          2: { cellWidth: 52 },
          3: { cellWidth: pageW - 28 - 16 - 52 - 52 },
        },
        didDrawCell: (data) => {
          if (data.section === 'body' && data.column.index === 3) {
            const cellText = String(data.cell.raw || '')
            if (/wins/i.test(cellText)) {
              data.cell.styles.textColor = [21, 128, 61]
              data.cell.styles.fontStyle = 'bold'
            } else if (/pending/i.test(cellText)) {
              data.cell.styles.textColor = [180, 83, 9]
              data.cell.styles.fontStyle = 'bold'
            }
          }
        },
      })
      y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : y + 10
    }

    // Footer
    doc.setFillColor(...ink)
    doc.rect(0, pageH - 10, pageW, 10, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text('BodyMax Boxing Events', 14, pageH - 3.8)
    doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageW - 14, pageH - 3.8, { align: 'right' })

    return { doc, fileName: `results-${event?.name?.replace(/[^\w-]+/g, '-') || 'event'}-${new Date().toISOString().slice(0, 10)}.pdf` }
  }

  // Sort bouts for display: pro billing order first, then bout number
  const displayOrdered = [...ordered].sort((a, b) => {
    const ao = a.billingOrder ?? 0
    const bo = b.billingOrder ?? 0
    if (isPro && (ao || bo)) return ao - bo
    return a.boutNumber - b.boutNumber
  })

  const pageHeader = isPro ? (
    <>
      <h1 className="text-[26px] font-black leading-tight tracking-tight text-slate-900">Results — {event.name}</h1>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-rose-600">
        {[event.pro?.promotionName, event.pro?.tagline].filter(Boolean).join(' · ')}
      </p>
    </>
  ) : (
    <h1 className="text-[26px] font-black leading-tight tracking-tight text-slate-900">Results — {event.name}</h1>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {isPro ? 'Professional Fight Night' : 'Amateur Tournament'}
          </p>
          {pageHeader}
          <p className="mt-1 text-slate-500">{eventMeta}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">{completed}/{displayed.length} decided</span>
          <Button size="sm" onClick={downloadPdf} disabled={!hasResults}>
            <Icon name="download" className="mr-1.5 h-3.5 w-3.5" />
            Export PDF
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShareOpen(true)} disabled={!hasResults}>
            <Icon name="mail" className="mr-1.5 h-3.5 w-3.5" />
            Share
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <StatTile label="Bouts" value={displayed.length} tone="slate" />
        <StatTile label="Decided" value={decided} tone="emerald" />
        <StatTile label="Pending" value={pending} tone={pending > 0 ? 'amber' : 'emerald'} />
        <StatTile label="Walkovers" value={walkovers} tone="amber" />
      </div>

      <div className="grid gap-4">
        {displayed.length === 0 ? (
          <Card>
            <Empty title={hidden > 0 ? 'Bouts exist but no boxers assigned' : 'No bouts yet'} message="Create a draw first — results are recorded per bout." />
          </Card>
        ) : (
          <>
            {displayed.map((b) => {
              const winnerId = b.winnerId ? String(b.winnerId._id || b.winnerId) : null
              const decided = b.status === 'completed' || b.status === 'walkover'
              const aWin = decided && b.boxerAId && String(b.boxerAId._id) === winnerId
              const bWin = decided && b.boxerBId && String(b.boxerBId._id) === winnerId
              const cat = b.category || {}
              const aDetails = boxerDetails(b.boxerAId)
              const bDetails = boxerDetails(b.boxerBId)
              const weight = uniqueParts([aDetails.weight || cat.weight, bDetails.weight || cat.weight]).join(' vs ') || 'Category TBD'
              const age = uniqueParts([aDetails.age || cat.age, bDetails.age || cat.age]).join(' vs ')
              const gender = uniqueParts([aDetails.gender || genderLabel(cat.gender), bDetails.gender || genderLabel(cat.gender)]).join(' vs ')
              const format = [
                b.numberOfRounds ? `${b.numberOfRounds}R` : null,
                b.minutesPerRound ? `${b.minutesPerRound} min` : null,
              ]
                .filter(Boolean)
                .join(' × ')
              const resultLabel = b.result?.proMethod || b.result?.method || (decided ? 'Decision' : '')
              const isTitleFight = b.titleFight || (isPro && b.boutType === 'main_event')

              return (
                <article
                  key={b._id}
                  className={cn(
                    'group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_20px_45px_-28px_rgba(15,23,42,0.4)]',
                    decided ? 'border-emerald-100/60 bg-emerald-5' : 'border-slate-200/80'
                  )}
                >
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-xs font-black text-white shadow-sm">
                        {b.boutNumber}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                          {b.boutType === 'main_event' ? 'Main Event' : b.boutType === 'co_main' ? 'Co-Main' : 'Undercard'}
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-slate-900 truncate">
                          {b.boxerAId?.boxerId?.professional?.ringName || b.boxerAId?.boxerId?.fullName || 'TBA'}
                          {' vs '}
                          {b.boxerBId?.boxerId?.professional?.ringName || b.boxerBId?.boxerId?.fullName || 'TBA'}
                        </p>
                        <p className="text-[11px] text-slate-500">{weight} · {ageGender || '—'}</p>
                        {isTitleFight && (
                          <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-amber-900/20 px-2 py-0.5 text-[9px] font-bold text-amber-400 ring-1 ring-inset ring-amber-900/30">
                            Title — {b.titleName || 'Championship'}
                          </span>
                        )}
                      </div>
                    </div>
                    <StatusPill status={b.status} />
                  </div>

                  <div className="px-4 py-4">
                    {decided ? (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className={`text-[11px] font-bold ${aWin ? 'text-emerald-600' : 'text-slate-500'}`}>
                            {aWin ? 'WINNER' : b.boxerAId?.boxerId?.fullName || 'TBA'}
                          </span>
                          {isPro && b.result?.knockdownsA && (
                            <span className="text-[10px] font-bold text-amber-700">KD {b.result.knockdownsA}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[11px] font-bold ${bWin ? 'text-emerald-600' : 'text-slate-500'}`}>
                            {bWin ? 'WINNER' : b.boxerBId?.boxerId?.fullName || 'TBA'}
                          </span>
                          {isPro && b.result?.knockdownsB && (
                            <span className="text-[10px] font-bold text-amber-700">KD {b.result.knockdownsB}</span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="block text-[11px] font-bold text-emerald-600">{resultLabel}</span>
                          {b.result?.round && <span className="block text-[10px] text-slate-500">Round {b.result.round}</span>}
                          {isPro && b.result?.scorecards?.length && (
                            <div className="mt-1 text-[10px] text-slate-500">
                              {b.result.scorecards.map((s, i) => (
                                <span key={i} className="mr-2">{s.judgeName}: {s.boxerAScore ?? '–'}-{s.boxerBScore ?? '–'}</span>
                              ))}
                            </div>
                          )}
                          {b.result?.titleChanged && <span className="block text-[10px] font-bold text-amber-600">Title changed hands</span>}
                          {b.result?.notes && <span className="block text-[10px] text-emerald-700">{b.result.notes}</span>}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-slate-900">
                          {b.boxerAId?.boxerId?.fullName || 'TBA'} vs {b.boxerBId?.boxerId?.fullName || 'TBA'}
                        </span>
                        <Button size="sm" onClick={() => openRecord(b)}>
                          Record Result
                          <Icon name="chevronRight" className="ml-1.5 h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </>
        )}
      </div>

      {hidden > 0 && (
        <Card className="border-amber-200 bg-amber-50/60">
          <div className="px-4 py-3 text-sm text-amber-800">
            {hidden} bout{hidden === 1 ? '' : 's'} without assigned boxers are hidden from results.
          </div>
        </Card>
      )}

      {/* Result modal */}
      <Modal
        open={!!recordBout}
        onClose={() => setRecordBout(null)}
        title={`Record Result — Bout #${recordBout?.boutNumber || ''}`}
        size="lg"
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

          {isPro ? (
            <>
              <Select
                label="Method of Victory (Pro)"
                value={form.proMethod}
                onChange={(e) => setForm({ ...form, proMethod: e.target.value })}
              >
                <option value="">Select method</option>
                {PRO_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
              <Select
                label="Method (Amateur fallback)"
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value })}
                disabled={isPro}
              >
                <option value="">—</option>
                {AMATEUR_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </Select>
            </>
          ) : (
            <Select label="Method of Victory" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
              <option value="">Select method</option>
              {AMATEUR_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </Select>
          )}

          <Input
            label="Round Finished"
            type="number"
            value={form.round}
            onChange={(e) => setForm({ ...form, round: e.target.value })}
            placeholder="Optional"
          />

          {isPro && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Knockdowns — Corner A"
                  type="number"
                  value={form.knockdownsA}
                  onChange={(e) => setForm({ ...form, knockdownsA: e.target.value })}
                  placeholder="0"
                />
                <Input
                  label="Knockdowns — Corner B"
                  type="number"
                  value={form.knockdownsB}
                  onChange={(e) => setForm({ ...form, knockdownsB: e.target.value })}
                  placeholder="0"
                />
              </div>
              {recordBout?.titleFight && (
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.titleChanged}
                    onChange={(e) => setForm({ ...form, titleChanged: e.target.checked })}
                    className="h-4 w-4 rounded"
                  />
                  Title changed hands
                </label>
              )}
              {isProDecision && (
                <Card title="Judge Scorecards">
                  <p className="text-[11px] text-slate-500 mb-3">Enter scores per judge. Scores auto-total when you add round scores.</p>
                  <div className="space-y-3">
                    {form.scorecards.map((card, i) => (
                      <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-slate-700">Judge {i + 1}</label>
                          <Input
                            value={card.judgeName}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                scorecards: form.scorecards.map((c, j) => (j === i ? { ...c, judgeName: e.target.value } : c)),
                              })
                            }
                            placeholder="Judge name"
                            className="w-32 text-xs"
                          />
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-[10px]">
                          <div className="text-center">
                            <span className="block text-slate-500 uppercase">Corner A</span>
                            <Input
                              type="number"
                              value={card.boxerAScore ?? ''}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  scorecards: form.scorecards.map((c, j) =>
                                    j === i ? { ...c, boxerAScore: e.target.value ? Number(e.target.value) : null } : c,
                                  ),
                                })
                              }
                              className="w-full text-xs text-center"
                              placeholder="–"
                            />
                          </div>
                          <div className="text-center">
                            <span className="block text-slate-500 uppercase">Corner B</span>
                            <Input
                              type="number"
                              value={card.boxerBScore ?? ''}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  scorecards: form.scorecards.map((c, j) =>
                                    j === i ? { ...c, boxerBScore: e.target.value ? Number(e.target.value) : null } : c,
                                  ),
                                })
                              }
                              className="w-full text-xs text-center"
                              placeholder="–"
                            />
                          </div>
                          <div className="col-span-2 text-right">
                            <span className="block text-slate-500 uppercase">Total</span>
                            <span className="block font-bold text-slate-900">
                              {card.boxerAScore != null && card.boxerBScore != null ? `${card.boxerAScore}-${card.boxerBScore}` : '–'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}

          <Textarea label="Notes (officials)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Officials notes…" />
        </div>
      </Modal>

      {/* Share modal */}
      <Modal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Share Results PDF"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShareOpen(false)}>Cancel</Button>
            <Button onClick={sendShare} disabled={shareBusy || !shareEmail.trim()}>
              {shareBusy ? <Spinner className="h-4 w-4 border-white" /> : 'Send Email'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">Email the generated results PDF to another organization.</p>
        <div className="mt-4 space-y-4">
          <Input label="Recipient Email" type="email" value={shareEmail} onChange={(e) => setShareEmail(e.target.value)} placeholder="org@example.com" required />
          <Textarea label="Short message (optional)" value={shareMessage} onChange={(e) => setShareMessage(e.target.value)} rows={3} placeholder="e.g. Please find the official results for this event." />
        </div>
        {shareError && <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{shareError}</p>}
      </Modal>
    </div>
  )
}

function StatTile({ label, value, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-50 text-slate-900 ring-slate-200',
    emerald: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-900 ring-amber-200',
  }
  return (
    <div className={cn('rounded-2xl border p-4 flex flex-col items-center', tones[tone])}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-1.5 text-2xl font-black leading-none">{value}</p>
    </div>
  )
}
