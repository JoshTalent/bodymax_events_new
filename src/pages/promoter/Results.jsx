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
import { loadPhoto } from '../../utils/fightCardPdf.js'

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
  const photo = reg?.boxerId?.photoUrl
  const club = reg?.boxerId?.clubName || reg?.clubId?.name
  const isRed = corner === 'red'
  const cornerBase = isRed
    ? { label: 'Red Corner', avatar: 'bg-red-600 text-white', border: 'border-red-200' }
    : { label: 'Blue Corner', avatar: 'bg-blue-600 text-white', border: 'border-blue-200' }

  const avatarClass = cn(
    'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm',
    winner ? 'bg-emerald-600 text-white' : cornerBase.avatar
  )

  return (
    <div className={cn(
      'flex flex-1 items-center gap-3 rounded-xl border px-3 py-3 transition',
      winner ? 'border-emerald-300 bg-emerald-50 shadow-sm' : cn('bg-white', cornerBase.border)
    )}>
      {photo ? (
        <img
          src={photo}
          alt={name || 'Boxer'}
          className={avatarClass}
        />
      ) : (
        <span className={avatarClass}>
          {initials(name)}
        </span>
      )}
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
      setShareError(err.message)
    } finally {
      setShareBusy(false)
    }
  }

  const buildPdf = async () => {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })

    const slate = [15, 23, 42]
    const red = [220, 38, 38]
    const blue = [37, 99, 235]
    const emerald = [5, 150, 105]
    const amber = [180, 83, 9]
    const gray = [100, 116, 139]
    const ink = [30, 41, 59]
    const line = [226, 232, 240]
    const light = [248, 250, 252]
    const emeraldSoft = [236, 253, 245]

    const pageW = doc.internal.pageSize.getWidth()
    const M = 14

    // Brand logo for the document header.
    const logo = await loadPhoto('/logo.png')

    // Branded header band
    doc.setFillColor(...slate)
    doc.rect(0, 0, pageW, 30, 'F')
    doc.setFillColor(...red)
    doc.rect(0, 30, pageW, 1.2, 'F')

    if (logo) {
      doc.addImage(logo.dataUrl, logo.format, pageW - M - 11, 5, 11, 11)
    }

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
    doc.text('OFFICIAL EVENT RESULTS', pageW - M, 21, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(148, 163, 184)
    doc.text(
      `Generated ${new Date().toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
      pageW - M,
      26,
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

    // Preload boxer photos (if any) so avatars can be embedded in the table.
    const photoUrls = [
      ...new Set(
        displayed
          .flatMap((b) => [b.boxerAId?.boxerId?.photoUrl, b.boxerBId?.boxerId?.photoUrl])
          .filter(Boolean)
      ),
    ]
    const photoMap = new Map(await Promise.all(photoUrls.map(async (url) => [url, await loadPhoto(url)])))
    const photoFor = (reg) => {
      const url = reg?.boxerId?.photoUrl
      return url ? photoMap.get(url) || null : null
    }

    const STATUS_LABEL = {
      in_progress: 'LIVE',
      ready: 'READY',
      scheduled: 'PENDING',
      postponed: 'POSTPONED',
      cancelled: 'CANCELLED',
    }

    const cornerMeta = (reg) => ({
      name: reg?.boxerId?.fullName || '',
      club: reg?.boxerId?.clubName || reg?.clubId?.name || 'Individual',
      photo: photoFor(reg),
    })

    const rowMeta = displayed.map((b) => {
      const winnerId = b.winnerId ? String(b.winnerId._id || b.winnerId) : null
      const decided = b.status === 'completed' || b.status === 'walkover'
      const aWin = decided && b.boxerAId && String(b.boxerAId._id) === winnerId
      const bWin = decided && b.boxerBId && String(b.boxerBId._id) === winnerId
      const cat = b.category || {}
      const gender = cat.gender === 'M' ? 'Male' : cat.gender === 'F' ? 'Female' : cat.gender || ''
      const format = [
        b.numberOfRounds ? `${b.numberOfRounds}R` : null,
        b.minutesPerRound ? `${b.minutesPerRound} min` : null,
      ]
        .filter(Boolean)
        .join(' × ')

      return {
        number: b.boutNumber,
        roundName: b.roundName || '',
        status: b.status,
        aWin: !!aWin,
        bWin: !!bWin,
        a: cornerMeta(b.boxerAId),
        b: cornerMeta(b.boxerBId),
        weight: cat.weight || 'Category TBD',
        ageGender: [cat.age, gender].filter(Boolean).join(' · ') || '—',
        format,
        method: `${b.result?.method || 'Decision'}${b.result?.round ? ` · R${b.result.round}` : ''}`,
        winnerName: b.winnerId?.boxerId?.fullName || '',
        label: b.status === 'completed' ? null : b.status === 'walkover' ? 'WALKOVER' : STATUS_LABEL[b.status] || String(b.status || '').toUpperCase(),
        accent: b.status === 'completed' ? emerald : b.status === 'walkover' ? amber : b.status === 'in_progress' ? red : gray,
      }
    })

    // Width-aware truncation so painted labels never spill over cell borders.
    const fit = (text, maxWidth, size, style = 'normal') => {
      doc.setFont('helvetica', style)
      doc.setFontSize(size)
      let out = String(text ?? '')
      if (doc.getTextWidth(out) <= maxWidth) return out
      while (out.length > 1 && doc.getTextWidth(`${out}…`) > maxWidth) out = out.slice(0, -1)
      return `${out.trimEnd()}…`
    }

    // Circular avatar with the photo clipped to the circle, or initials as a fallback.
    const drawAvatar = (photo, name, winner, corner, cx, cy, r) => {
      doc.setFillColor(255, 255, 255)
      doc.setDrawColor(...line)
      doc.setLineWidth(0.25)
      doc.circle(cx, cy, r + 0.7, 'FD')

      let embedded = false
      if (photo) {
        doc.saveGraphicsState()
        try {
          doc.circle(cx, cy, r, null)
          doc.clip()
          doc.discardPath()
          doc.addImage(photo.dataUrl, photo.format, cx - r, cy - r, r * 2, r * 2)
          embedded = true
        } catch {
          // If the image can't be embedded, fall back to the initials below.
        }
        doc.restoreGraphicsState()
      }

      if (!embedded) {
        doc.setFillColor(...(winner ? emerald : corner === 'red' ? red : blue))
        doc.circle(cx, cy, r, 'F')
        doc.setTextColor(255)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7)
        doc.text(initials(name), cx, cy + 1.1, { align: 'center' })
      }

      doc.setDrawColor(...(winner ? emerald : corner === 'red' ? red : blue))
      doc.setLineWidth(0.5)
      doc.circle(cx, cy, r + 0.1, 'S')
    }

    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M, bottom: 24 },
      head: [['BOUT', 'RED CORNER', 'BLUE CORNER', 'BOUT DETAILS', 'RESULT']],
      body: displayed.map(() => ['', '', '', '', '']),
      theme: 'grid',
      rowPageBreak: 'avoid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        textColor: ink,
        lineColor: line,
        lineWidth: 0.25,
        overflow: 'linebreak',
      },
      bodyStyles: { minCellHeight: 17, valign: 'middle', fillColor: 255 },
      headStyles: {
        fillColor: slate,
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 7,
        lineWidth: 0,
        valign: 'middle',
        cellPadding: { top: 3.2, right: 3, bottom: 3.2, left: 3.4 },
      },
      alternateRowStyles: { fillColor: light },
      columnStyles: {
        0: { cellWidth: 16, halign: 'center' },
        1: { cellWidth: 44 },
        2: { cellWidth: 44 },
        3: { cellWidth: 34 },
        4: { cellWidth: 44 },
      },
      didParseCell: (data) => {
        if (data.section !== 'body') return
        const meta = rowMeta[data.row.index]
        if (!meta) return
        // The table is only a layout scaffold; all content is painted in didDrawCell.
        data.cell.text = []
        if (data.column.index === 1 && meta.aWin) data.cell.styles.fillColor = emeraldSoft
        if (data.column.index === 2 && meta.bWin) data.cell.styles.fillColor = emeraldSoft
      },
      didDrawCell: (data) => {
        if (data.section !== 'body') return
        const meta = rowMeta[data.row.index]
        if (!meta) return

        const { x, y: top, width, height } = data.cell
        const pad = 3
        const midY = top + height / 2

        // Bout number badge (with the round name underneath when known).
        if (data.column.index === 0) {
          const bw = 10.5
          const bh = 6.2
          const bx = x + (width - bw) / 2
          const by = midY - bh / 2 - (meta.roundName ? 2.2 : 0)
          doc.setFillColor(...slate)
          doc.roundedRect(bx, by, bw, bh, 1.6, 1.6, 'F')
          doc.setTextColor(255)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(7.8)
          doc.text(`#${meta.number}`, bx + bw / 2, by + bh / 2 + 1.25, { align: 'center' })

          if (meta.roundName) {
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(5.2)
            doc.setTextColor(...gray)
            doc.text(fit(meta.roundName.toUpperCase(), width - 2, 5.2), x + width / 2, by + bh + 4, { align: 'center' })
          }
          return
        }

        // Boxer corners with circular avatar, name and club.
        if (data.column.index === 1 || data.column.index === 2) {
          const isA = data.column.index === 1
          const corner = isA ? meta.a : meta.b
          const winner = isA ? meta.aWin : meta.bWin
          const r = 4.1
          const cx = x + pad + r
          const tx = cx + r + 2.4
          const maxW = width - (tx - x) - pad

          if (!corner.name) {
            doc.setFillColor(...light)
            doc.setDrawColor(...line)
            doc.setLineWidth(0.25)
            doc.circle(cx, midY, r, 'FD')
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(7.4)
            doc.setTextColor(...gray)
            doc.text('Bye', tx, midY - 0.4)
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(6.2)
            doc.text('No opponent', tx, midY + 3.1)
            return
          }

          drawAvatar(corner.photo, corner.name, winner, isA ? 'red' : 'blue', cx, midY, r)

          doc.setFont('helvetica', 'bold')
          doc.setFontSize(8)
          doc.setTextColor(...(winner ? emerald : ink))
          doc.text(fit(corner.name, maxW, 8, 'bold'), tx, midY - 0.9)

          doc.setFont('helvetica', 'normal')
          doc.setFontSize(6.2)
          doc.setTextColor(...gray)
          doc.text(fit(corner.club, maxW, 6.2), tx, midY + 3)
          return
        }

        // Category (weight / age / gender) plus the bout format chip.
        if (data.column.index === 3) {
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(7.4)
          doc.setTextColor(...ink)
          doc.text(fit(meta.weight, width - pad * 2, 7.4, 'bold'), x + pad, top + 5)

          doc.setFont('helvetica', 'normal')
          doc.setFontSize(6.4)
          doc.setTextColor(...gray)
          doc.text(fit(meta.ageGender, width - pad * 2, 6.4), x + pad, top + 8.4)

          if (meta.format) {
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(6)
            const chipW = Math.min(width - pad * 2, doc.getTextWidth(meta.format) + 5)
            const chipH = 4.8
            const chipX = x + pad
            const chipY = top + height - chipH - 2.2
            doc.setFillColor(...slate)
            doc.roundedRect(chipX, chipY, chipW, chipH, 1.4, 1.4, 'F')
            doc.setTextColor(255)
            doc.text(meta.format, chipX + chipW / 2, chipY + chipH / 2 + 1.1, { align: 'center' })
          } else {
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(6.2)
            doc.setTextColor(...gray)
            doc.text('Format TBD', x + pad, top + height - 4)
          }
          return
        }

        // Result: method + finishing round, winner, or the current status.
        if (data.column.index === 4) {
          const rx = x + 3.6
          const maxW = width - 6.6

          doc.setFillColor(...meta.accent)
          doc.roundedRect(x + 0.9, top + 3, 1, height - 6, 0.5, 0.5, 'F')

          if (meta.status === 'completed') {
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(7.8)
            doc.setTextColor(...emerald)
            doc.text(fit(meta.method, maxW, 7.8, 'bold'), rx, top + 7)
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(6.3)
            doc.setTextColor(...ink)
            doc.text(fit(meta.winnerName || 'Winner', maxW, 6.3), rx, top + 11)
            return
          }

          if (meta.status === 'walkover') {
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(7.8)
            doc.setTextColor(...amber)
            doc.text('WALKOVER', rx, top + 7)
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(6.3)
            doc.setTextColor(...ink)
            doc.text(fit(meta.winnerName || 'Winner', maxW, 6.3), rx, top + 11)
            return
          }

          doc.setFont('helvetica', 'bold')
          doc.setFontSize(7.4)
          doc.setTextColor(...meta.accent)
          doc.text(meta.label || 'PENDING', rx, top + 7)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(6.2)
          doc.setTextColor(...gray)
          doc.text('Awaiting result', rx, top + 11)
        }
      },
    })

    const finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || y

    if (pending > 0) {
      const pageH = doc.internal.pageSize.getHeight()
      let noteY = finalY + 6
      if (noteY > pageH - 14) {
        doc.addPage()
        noteY = 24
      }
      doc.setFontSize(8)
      doc.setTextColor(...amber)
      doc.text(`${pending} bout${pending === 1 ? '' : 's'} still pending — results will appear once recorded.`, M, noteY)
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
    return { doc, fileName: `results-${safeName}.pdf` }
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
              <StatTile label="Total Bouts" value={displayed.length} tone="slate" />
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
                {decided} of {displayed.length} bouts decided
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
          {hidden > 0 && (
            <span className="ml-2 text-xs text-slate-400">· {hidden} unassigned slot{hidden === 1 ? '' : 's'} hidden</span>
          )}
        </p>
        {displayed.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => { setShareEmail(''); setShareMessage(''); setShareError(''); setShareOpen(true) }} disabled={!hasResults}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
              Share PDF
            </Button>
            <Button variant="secondary" onClick={downloadPdf} disabled={!hasResults}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download PDF
            </Button>
          </div>
        )}
      </div>

      {!bouts ? (
        <div className="mt-5"><Loading /></div>
      ) : displayed.length === 0 ? (
        <div className="mt-5">
          <Card>
            <Empty
              title={ordered.length === 0 ? 'No bouts yet' : 'No boxers in this card'}
              message={
                ordered.length === 0
                  ? 'Create a draw first — results are recorded per bout.'
                  : 'All boxer matchups were removed, so there is nothing to display.'
              }
              action={ordered.length === 0 ? <Button onClick={() => navigate(`/app/events/${id}/draws`)}>Go to Draws</Button> : undefined}
            />
          </Card>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {displayed.map((b) => {
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
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white shadow-sm">{b.boutNumber}</span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bout #{b.boutNumber}</p>
                      <p className="text-xs text-slate-500">
                        <span className="font-medium text-slate-600">{b.category?.weight || 'All weights'}</span>
                        {b.category?.age ? ` · ${b.category.age}` : ''}
                        {b.category?.gender ? ` · ${b.category.gender}` : ''}
                        {b.ring ? ` · ${b.ring}` : ''}
                        {b.scheduledTime ? ` · ${b.scheduledTime}` : ''}
                        {(b.numberOfRounds || b.minutesPerRound) && (
                          <span className="ml-1.5 inline-flex items-center rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                            {[b.numberOfRounds ? `${b.numberOfRounds}R` : null, b.minutesPerRound ? `${b.minutesPerRound} min` : null].filter(Boolean).join(' × ')}
                          </span>
                        )}
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
        </div>
      </Modal>

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