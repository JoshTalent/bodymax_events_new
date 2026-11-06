// Builds a printable "official fight card" PDF that mirrors the public draw
// page's bout cards. Only the fight card is included — no hero, stats or side rail.

const INK = [15, 23, 42]
const GRAY = [100, 116, 139]
const LIGHT_GRAY = [148, 163, 184]
const LINE = [226, 232, 240]
const SOFT = [248, 250, 252]
const WHITE = [255, 255, 255]
const BLUE = [37, 99, 235]
const BLUE_SOFT = [239, 246, 255]
const BLUE_BORDER = [191, 219, 254]
const RED = [220, 38, 38]
const RED_SOFT = [254, 242, 242]
const RED_BORDER = [254, 202, 202]
const EMERALD = [5, 150, 105]
const EMERALD_SOFT = [236, 253, 245]
const EMERALD_BORDER = [167, 243, 208]
const AMBER = [217, 119, 6]
const AMBER_SOFT = [255, 251, 235]
const SLATE_SOFT = [241, 245, 249]

const STATUS = {
  scheduled: { label: 'SCHEDULED', bg: BLUE_SOFT, fg: [29, 78, 216], rail: [96, 165, 250] },
  ready: { label: 'READY', bg: BLUE_SOFT, fg: [29, 78, 216], rail: [96, 165, 250] },
  in_progress: { label: 'LIVE', bg: AMBER_SOFT, fg: [180, 83, 9], rail: [251, 191, 36] },
  completed: { label: 'COMPLETED', bg: EMERALD_SOFT, fg: [4, 120, 87], rail: [52, 211, 153] },
  walkover: { label: 'WALKOVER', bg: AMBER_SOFT, fg: [180, 83, 9], rail: [110, 231, 183] },
  postponed: { label: 'POSTPONED', bg: SLATE_SOFT, fg: [71, 85, 105], rail: [203, 213, 225] },
  cancelled: { label: 'CANCELLED', bg: SLATE_SOFT, fg: [71, 85, 105], rail: [203, 213, 225] },
}

const M = 14
const CARD_GAP = 5
const CARD_PAD = 4.5
const HEADER_H = 15
const BODY_H_BOTH = 24
const BODY_H_SINGLE = 30

const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'

function ageFrom(dob) {
  if (!dob) return null
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const monthDiff = now.getMonth() - d.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d.getDate())) age -= 1
  return age > 0 && age < 120 ? age : null
}

// Truncate text to fit a width (assumes the right font/size is already set).
function fitText(doc, text, maxWidth) {
  const value = String(text || '')
  if (!value) return ''
  if (doc.getTextWidth(value) <= maxWidth) return value
  let out = value
  while (out.length > 1 && doc.getTextWidth(`${out}...`) > maxWidth) {
    out = out.slice(0, -1)
  }
  return `${out.trimEnd()}...`
}

export async function loadPhoto(url) {
  if (!url || typeof document === 'undefined') return Promise.resolve(null)
  return new Promise((resolve) => {
    let settled = false
    const finish = (value) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(value)
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.referrerPolicy = 'no-referrer'
    const timer = setTimeout(() => finish(null), 12000)

    img.onload = () => {
      try {
        if (!img.width || !img.height) {
          finish(null)
          return
        }
        const size = 400
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        const scale = Math.max(size / img.width, size / img.height)
        const w = img.width * scale
        const h = img.height * scale
        // Crop towards the top so faces stay visible in the square avatar.
        ctx.drawImage(img, (size - w) / 2, 0, w, h)
        finish({ dataUrl: canvas.toDataURL('image/jpeg', 0.92), format: 'JPEG' })
      } catch {
        finish(null)
      }
    }
    img.onerror = () => finish(null)
    img.src = url
  })
}

function badge(doc, x, y, number) {
  doc.setFillColor(...INK)
  doc.roundedRect(x, y, 8, 8, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...WHITE)
  doc.text(String(number), x + 4, y + 5.4, { align: 'center' })
}

function chip(doc, text, x, y, bg, fg) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(5.6)
  const width = doc.getTextWidth(text) + 3.8
  doc.setFillColor(...bg)
  doc.roundedRect(x, y, width, 4.3, 1.2, 1.2, 'F')
  doc.setTextColor(...fg)
  doc.text(text, x + 1.9, y + 3)
  return width
}

function statusPill(doc, status, xRight, y) {
  const meta = STATUS[status] || STATUS.scheduled
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(5.6)
  const width = doc.getTextWidth(meta.label) + 5
  const x = xRight - width
  doc.setFillColor(...meta.bg)
  doc.roundedRect(x, y, width, 5.2, 2.6, 2.6, 'F')
  doc.setTextColor(...meta.fg)
  doc.text(meta.label, x + width / 2, y + 3.5, { align: 'center' })
}

function drawAvatar(doc, { x, y, size, photo, fallbackColor, name }) {
  if (photo) {
    try {
      // White ring behind the photo keeps it crisp on the tinted background.
      doc.setFillColor(...WHITE)
      doc.roundedRect(x - 0.9, y - 0.9, size + 1.8, size + 1.8, 1.6, 1.6, 'F')
      doc.addImage(photo.dataUrl, photo.format, x, y, size, size)
      doc.setDrawColor(...WHITE)
      doc.setLineWidth(0.4)
      doc.roundedRect(x - 0.9, y - 0.9, size + 1.8, size + 1.8, 1.6, 1.6, 'S')
      return
    } catch {
      // Fall through to initials if the image cannot be embedded.
    }
  }

  doc.setFillColor(...fallbackColor)
  doc.roundedRect(x, y, size, size, 1.8, 1.8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(size >= 18 ? 9 : 5.8)
  doc.setTextColor(...WHITE)
  doc.text(initials(name), x + size / 2, y + size / 2 + (size >= 18 ? 3 : 2), { align: 'center' })
}

function drawCorner(doc, { x, y, w, h, boxer, photo, side, winner, featured }) {
  const isRed = side === 'A'
  const soft = winner ? EMERALD_SOFT : isRed ? RED_SOFT : BLUE_SOFT
  const border = winner ? EMERALD_BORDER : isRed ? RED_BORDER : BLUE_BORDER
  const rail = winner ? EMERALD : isRed ? RED : BLUE
  const cornerLabel = isRed ? 'RED CORNER' : 'BLUE CORNER'

  doc.setFillColor(...soft)
  doc.setDrawColor(...border)
  doc.setLineWidth(0.3)
  doc.roundedRect(x, y, w, h, 2, 2, 'FD')

  doc.setFillColor(...rail)
  doc.roundedRect(x, y + 0.1, 1.7, h - 0.2, 0.85, 0.85, 'F')

  const avatarSize = featured ? 22 : 13
  const avatarX = x + 4
  const avatarY = y + (h - avatarSize) / 2
  drawAvatar(doc, {
    x: avatarX,
    y: avatarY,
    size: avatarSize,
    photo: boxer?.photo || null,
    fallbackColor: rail,
    name: boxer?.name,
  })

  const tx = avatarX + avatarSize + 3.5
  const maxWidth = x + w - tx - 3.5

  if (!boxer?.name) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(5.5)
    doc.setTextColor(...LIGHT_GRAY)
    doc.text(cornerLabel, tx, y + (featured ? 12 : 10))
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...GRAY)
    doc.text('Bye — no opponent', tx, y + (featured ? 17 : 14.5))
    return
  }

  if (featured) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6)
    doc.setTextColor(...LIGHT_GRAY)
    doc.text(cornerLabel, tx, y + 7)

    doc.setFontSize(13)
    doc.setTextColor(...INK)
    doc.text(fitText(doc, boxer.name, maxWidth), tx, y + 13.8)

    if (winner) {
      doc.setFontSize(7)
      doc.setTextColor(...EMERALD)
      doc.text('WINNER', tx, y + 18.4)
    }

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...GRAY)
    doc.text(fitText(doc, boxer.club || 'Individual', maxWidth), tx, y + (winner ? 23.2 : 19.5))

    const meta = [boxer.record, boxer.age ? `${boxer.age} yrs` : null, boxer.nationality]
      .filter(Boolean)
      .join(' · ')
    if (meta) {
      doc.setFontSize(6.5)
      doc.setTextColor(...GRAY)
      doc.text(fitText(doc, meta, maxWidth), tx, y + (winner ? 27.2 : 24))
    }
    return
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(5.5)
  doc.setTextColor(...LIGHT_GRAY)
  doc.text(cornerLabel, tx, y + 6)

  doc.setFontSize(9)
  doc.setTextColor(...INK)
  doc.text(fitText(doc, boxer.name, maxWidth), tx, y + 10.6)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.4)
  doc.setTextColor(...GRAY)
  doc.text(fitText(doc, boxer.club || 'Individual', maxWidth), tx, y + 14.5)

  const meta = [boxer.record, boxer.age ? `${boxer.age} yrs` : null].filter(Boolean).join(' · ')
  if (meta) {
    doc.setFontSize(5.8)
    doc.setTextColor(...GRAY)
    doc.text(fitText(doc, meta, maxWidth), tx, y + 18)
  }
}

function drawBoutCard(doc, { x, y, w, bout, photos }) {
  const winnerRegId = bout.winnerId && typeof bout.winnerId === 'object' ? bout.winnerId._id : bout.winnerId
  const isWinnerA = winnerRegId && String(winnerRegId) === String(bout.boxerAId?._id)
  const isWinnerB = winnerRegId && String(winnerRegId) === String(bout.boxerBId?._id)
  const resultRecorded = !!bout.winnerId
  const hasA = !!bout.boxerAId?.boxerId?.fullName
  const hasB = !!bout.boxerBId?.boxerId?.fullName
  const hasBye = !hasA || !hasB
  const single = resultRecorded || hasBye
  const bodyH = single ? BODY_H_SINGLE : BODY_H_BOTH
  const h = HEADER_H + bodyH + CARD_PAD
  const meta = STATUS[bout.status] || STATUS.scheduled

  doc.setFillColor(...WHITE)
  doc.setDrawColor(...LINE)
  doc.setLineWidth(0.3)
  doc.roundedRect(x, y, w, h, 2.4, 2.4, 'FD')

  // Colour rail on the left edge.
  doc.setFillColor(...meta.rail)
  doc.roundedRect(x, y + 0.1, 1.8, h - 0.2, 0.9, 0.9, 'F')

  badge(doc, x + CARD_PAD, y + 4, bout.boutNumber ?? '')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(5.8)
  doc.setTextColor(...LIGHT_GRAY)
  doc.text(`BOUT #${bout.boutNumber ?? ''}`, x + CARD_PAD + 10.5, y + 6.6)

  let cx = x + CARD_PAD + 10.5
  const chipY = y + 9.2
  if (bout.category?.weight) cx += chip(doc, bout.category.weight, cx, chipY, SLATE_SOFT, INK) + 1.5
  if (bout.category?.age) cx += chip(doc, bout.category.age, cx, chipY, SLATE_SOFT, GRAY) + 1.5
  if (bout.category?.gender) {
    const gender = bout.category.gender === 'M' ? 'Male' : bout.category.gender === 'F' ? 'Female' : bout.category.gender
    cx += chip(doc, gender, cx, chipY, SLATE_SOFT, GRAY) + 1.5
  }
  const format = [
    bout.numberOfRounds ? `${bout.numberOfRounds}R` : null,
    bout.minutesPerRound ? `${bout.minutesPerRound} min` : null,
  ]
    .filter(Boolean)
    .join(' × ')
  if (format) chip(doc, format, cx, chipY, INK, WHITE)

  statusPill(doc, bout.status, x + w - CARD_PAD, y + 4.2)

  if (resultRecorded && bout.result?.method) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(5.8)
    doc.setTextColor(...GRAY)
    const result = [bout.result.method, bout.result.round ? `R${bout.result.round}` : null]
      .filter(Boolean)
      .join(' · ')
    doc.text(fitText(doc, result, 34), x + w - CARD_PAD, y + 12.7, { align: 'right' })
  }

  const bodyY = y + HEADER_H
  const innerW = w - CARD_PAD * 2
  const innerX = x + CARD_PAD

  const boxerInfo = (reg) => {
    const boxer = reg?.boxerId
    const rec = boxer?.boxingRecord
    const wins = Number(rec?.wins) || 0
    const losses = Number(rec?.losses) || 0
    const draws = Number(rec?.draws) || 0
    return {
      name: boxer?.fullName || '',
      club: reg?.clubName || boxer?.clubName || reg?.clubId?.name || '',
      photo: boxer?.photoUrl ? photos.get(boxer.photoUrl) : null,
      age: ageFrom(boxer?.dateOfBirth),
      nationality: boxer?.nationality || '',
      record: wins + losses + draws > 0 ? `${wins}W ${losses}L ${draws}D` : '',
    }
  }

  if (resultRecorded) {
    const winnerReg = isWinnerA ? bout.boxerAId : isWinnerB ? bout.boxerBId : bout.boxerAId || bout.boxerBId
    drawCorner(doc, {
      x: innerX,
      y: bodyY,
      w: innerW,
      h: bodyH,
      boxer: boxerInfo(winnerReg),
      side: isWinnerB ? 'B' : 'A',
      winner: true,
      featured: true,
    })
    return h
  }

  if (hasBye) {
    const reg = hasA ? bout.boxerAId : bout.boxerBId
    drawCorner(doc, {
      x: innerX,
      y: bodyY,
      w: innerW,
      h: bodyH,
      boxer: boxerInfo(reg),
      side: hasA ? 'A' : 'B',
      winner: false,
      featured: true,
    })
    return h
  }

  const vsGap = 10
  const cornerW = (innerW - vsGap) / 2

  drawCorner(doc, {
    x: innerX,
    y: bodyY,
    w: cornerW,
    h: bodyH,
    boxer: boxerInfo(bout.boxerAId),
    side: 'A',
    winner: false,
    featured: false,
  })
  drawCorner(doc, {
    x: innerX + innerW - cornerW,
    y: bodyY,
    w: cornerW,
    h: bodyH,
    boxer: boxerInfo(bout.boxerBId),
    side: 'B',
    winner: false,
    featured: false,
  })

  // VS badge centred between the two corners.
  const vsX = x + w / 2
  const vsY = bodyY + bodyH / 2
  doc.setFillColor(...INK)
  doc.circle(vsX, vsY, 4, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6)
  doc.setTextColor(...WHITE)
  doc.text('VS', vsX, vsY + 2.1, { align: 'center' })

  return h
}

function fmtLongDate(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export async function buildFightCardPdf({ event, bouts }) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const contentW = pageW - M * 2

  // Brand logo for the document header.
  const logo = await loadPhoto('/logo.png')

  // Preload boxer photos once per URL; failures fall back to initials.
  const urls = [
    ...new Set(
      bouts
        .flatMap((b) => [b.boxerAId?.boxerId?.photoUrl, b.boxerBId?.boxerId?.photoUrl])
        .filter(Boolean)
    ),
  ]
  const photos = new Map(await Promise.all(urls.map(async (url) => [url, await loadPhoto(url)])))

  const date = fmtLongDate(event?.eventDate)
  const metaLine = [date, event?.venue, event?.location].filter(Boolean).join(' · ')

  const drawPageHeader = (continued = false) => {
    if (continued) {
      if (logo) {
        doc.addImage(logo.dataUrl, logo.format, M, 6, 12, 12)
      }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(...GRAY)
      doc.text(fitText(doc, `Official fight card · ${event?.name || 'Event'}`, contentW), M, 21)
      doc.setDrawColor(...LINE)
      doc.setLineWidth(0.3)
      doc.line(M, 26.5, pageW - M, 26.5)
      return 32
    }

    if (logo) {
      doc.addImage(logo.dataUrl, logo.format, M, 4, 12, 12)
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...BLUE)
    doc.text('OFFICIAL FIGHT CARD', M, 20)

    doc.setFontSize(16)
    doc.setTextColor(...INK)
    doc.text(fitText(doc, event?.name || 'Event', contentW), M, 27)

    if (metaLine) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(...GRAY)
      doc.text(fitText(doc, metaLine, contentW), M, 32)
    }

    doc.setDrawColor(...LINE)
    doc.setLineWidth(0.3)
    doc.line(M, 38, pageW - M, 38)
    return 44
  }

  let y = drawPageHeader(false)

  bouts.forEach((bout) => {
    const hasA = !!bout.boxerAId?.boxerId?.fullName
    const hasB = !!bout.boxerBId?.boxerId?.fullName
    const single = !!bout.winnerId || !hasA || !hasB
    const cardH = HEADER_H + (single ? BODY_H_SINGLE : BODY_H_BOTH) + CARD_PAD

    if (y + cardH > pageH - M) {
      doc.addPage()
      y = drawPageHeader(true)
    }

    drawBoutCard(doc, { x: M, y, w: contentW, bout, photos })
    y += cardH + CARD_GAP
  })

  // Page footers.
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(...GRAY)
    doc.text('Bodymax · Official fight card', M, pageH - 8)
    doc.text(`Page ${i} of ${pageCount}`, pageW - M, pageH - 8, { align: 'right' })
  }

  const safeName = (event?.name || 'event')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()

  return { doc, fileName: `fight-card-${safeName}.pdf` }
}
