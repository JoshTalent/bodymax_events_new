// Builds a premium printable "official fight card" PDF for an event.
// Only the fight card is included — no hero, stats or side rail.
// Every card carries real boxer data (gender, weight category, record, age).

const INK = [15, 23, 42]
const SLATE_800 = [30, 41, 59]
const SLATE_700 = [51, 65, 85]
const SLATE_600 = [71, 85, 105]
const GRAY = [100, 116, 139]
const LIGHT_GRAY = [148, 163, 184]
const LINE = [226, 232, 240]
const SOFT = [248, 250, 252]
const WHITE = [255, 255, 255]
const BLUE = [37, 99, 235]
const BLUE_LIGHT = [147, 197, 253]
const BLUE_SOFT = [239, 246, 255]
const BLUE_BORDER = [191, 219, 254]
const RED = [220, 38, 38]
const RED_SOFT = [254, 242, 242]
const RED_BORDER = [254, 202, 202]
const EMERALD = [5, 150, 105]
const EMERALD_SOFT = [236, 253, 245]
const EMERALD_BORDER = [167, 243, 208]
const AMBER = [180, 83, 9]
const AMBER_SOFT = [255, 251, 235]
const SLATE_SOFT = [241, 245, 249]
const GOLD = [245, 158, 11]

const STATUS = {
  scheduled: { label: 'SCHEDULED', bg: BLUE_SOFT, fg: [29, 78, 216], rail: [96, 165, 250] },
  ready: { label: 'READY', bg: BLUE_SOFT, fg: [29, 78, 216], rail: [96, 165, 250] },
  in_progress: { label: 'LIVE', bg: AMBER_SOFT, fg: AMBER, rail: GOLD },
  completed: { label: 'COMPLETED', bg: EMERALD_SOFT, fg: [4, 120, 87], rail: [52, 211, 153] },
  walkover: { label: 'WALKOVER', bg: AMBER_SOFT, fg: AMBER, rail: [110, 231, 183] },
  postponed: { label: 'POSTPONED', bg: SLATE_SOFT, fg: SLATE_600, rail: [203, 213, 225] },
  cancelled: { label: 'CANCELLED', bg: SLATE_SOFT, fg: SLATE_600, rail: [203, 213, 225] },
}

const M = 14
const CARD_GAP = 6
const CARD_PAD = 5
const HEADER_H = 16

const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'

const genderLabel = (gender) => (gender === 'M' ? 'Male' : gender === 'F' ? 'Female' : gender || '')

const uniqueParts = (values) => [...new Set(values.filter(Boolean))]

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

function chipWidth(doc, text, size = 5.6, padX = 2.2) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(size)
  return doc.getTextWidth(text) + padX * 2
}

function drawChip(doc, { text, x, y, bg, fg, border, size = 5.6, height = 4.6, padX = 2.2 }) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(size)
  const width = doc.getTextWidth(text) + padX * 2
  doc.setFillColor(...bg)
  if (border) {
    doc.setDrawColor(...border)
    doc.setLineWidth(0.25)
    doc.roundedRect(x, y, width, height, height / 2, height / 2, 'FD')
  } else {
    doc.roundedRect(x, y, width, height, height / 2, height / 2, 'F')
  }
  doc.setTextColor(...fg)
  doc.text(text, x + width / 2, y + height / 2 + size * 0.13, { align: 'center' })
  return width
}

function drawStatusPill(doc, status, xRight, y) {
  const meta = STATUS[status] || STATUS.scheduled
  const width = chipWidth(doc, meta.label, 5.6, 2.6)
  drawChip(doc, {
    text: meta.label,
    x: xRight - width,
    y,
    bg: meta.bg,
    fg: meta.fg,
    size: 5.6,
    height: 5.4,
    padX: 2.6,
  })
}

function drawBadge(doc, { x, y, number, size = 9.5, fill, fg }) {
  doc.setFillColor(...fill)
  doc.roundedRect(x, y, size, size, 2.4, 2.4, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...fg)
  doc.text(String(number ?? ''), x + size / 2, y + size / 2 + 1.55, { align: 'center' })
}

// Photo avatar with genuinely rounded corners (clipped), or an initials tile.
function drawAvatar(doc, { x, y, size, radius = 2.6, photo, name, fill = INK }) {
  if (photo) {
    doc.setFillColor(...WHITE)
    doc.setDrawColor(...WHITE)
    doc.setLineWidth(0.6)
    doc.roundedRect(x - 1, y - 1, size + 2, size + 2, radius + 0.6, radius + 0.6, 'FD')

    doc.saveGraphicsState()
    let embedded = false
    try {
      doc.roundedRect(x, y, size, size, radius, radius, null)
      doc.clip()
      doc.discardPath()
      doc.addImage(photo.dataUrl, photo.format, x, y, size, size)
      embedded = true
    } catch {
      // Fall back to the initials tile below.
    }
    doc.restoreGraphicsState()

    if (embedded) {
      doc.setDrawColor(...WHITE)
      doc.setLineWidth(0.4)
      doc.roundedRect(x - 1, y - 1, size + 2, size + 2, radius + 0.6, radius + 0.6, 'S')
      return
    }
  }

  doc.setFillColor(...fill)
  doc.roundedRect(x, y, size, size, radius, radius, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(size >= 18 ? 10 : 6.6)
  doc.setTextColor(...WHITE)
  doc.text(initials(name), x + size / 2, y + size / 2 + (size >= 18 ? 3.4 : 2.3), { align: 'center' })
}

function boxerInfo(reg, photos) {
  const boxer = reg?.boxerId
  const rec = boxer?.boxingRecord
  const wins = Number(rec?.wins) || 0
  const losses = Number(rec?.losses) || 0
  const draws = Number(rec?.draws) || 0
  return {
    name: boxer?.fullName || '',
    club: reg?.clubName || boxer?.clubName || reg?.clubId?.name || 'Individual',
    photo: boxer?.photoUrl ? photos.get(boxer.photoUrl) : null,
    age: ageFrom(boxer?.dateOfBirth),
    nationality: boxer?.nationality || '',
    record: wins + losses + draws > 0 ? `${wins}W ${losses}L ${draws}D` : '',
    gender: genderLabel(boxer?.gender),
    weight: boxer?.weightCategory || (boxer?.registeredWeightKg ? `${boxer.registeredWeightKg} kg` : ''),
    ageCategory: boxer?.ageCategory || '',
  }
}

function drawCornerPanel(doc, { x, y, w, h, boxer, side, large }) {
  const isRed = side === 'A'
  const soft = isRed ? RED_SOFT : BLUE_SOFT
  const border = isRed ? RED_BORDER : BLUE_BORDER
  const rail = isRed ? RED : BLUE
  const cornerLabel = isRed ? 'RED CORNER' : 'BLUE CORNER'

  doc.setFillColor(...soft)
  doc.setDrawColor(...border)
  doc.setLineWidth(0.3)
  doc.roundedRect(x, y, w, h, 2.6, 2.6, 'FD')

  doc.setFillColor(...rail)
  doc.roundedRect(x, y + 0.2, 1.7, h - 0.4, 0.85, 0.85, 'F')

  const avatarSize = large ? 18 : 14
  const avatarX = x + 4
  const avatarY = y + (h - avatarSize) / 2
  drawAvatar(doc, {
    x: avatarX,
    y: avatarY,
    size: avatarSize,
    radius: large ? 3.2 : 2.8,
    photo: boxer?.photo || null,
    fill: rail,
    name: boxer?.name,
  })

  const tx = avatarX + avatarSize + 3.4
  const maxWidth = x + w - tx - 4

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...rail)
  if (large) {
    doc.setFontSize(6)
    doc.text(cornerLabel, tx, y + 8.6)

    doc.setFontSize(11.5)
    doc.setTextColor(...INK)
    doc.text(fitText(doc, boxer?.name || 'TBD', maxWidth), tx, y + 15.4)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...GRAY)
    doc.text(fitText(doc, boxer?.club || 'Individual', maxWidth), tx, y + 20.6)

    const details = [boxer?.gender, boxer?.weight].filter(Boolean).join(' · ')
    if (details) {
      doc.setFontSize(6.2)
      doc.text(fitText(doc, details, maxWidth), tx, y + 25.4)
    }

    const record = [boxer?.record, boxer?.age ? `${boxer.age} yrs` : null, boxer?.nationality]
      .filter(Boolean)
      .join(' · ')
    if (record) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(5.6)
      doc.text(fitText(doc, record, maxWidth), tx, y + 29.8)
    }
    return
  }

  doc.setFontSize(5.2)
  doc.text(cornerLabel, tx, y + 7)

  doc.setFontSize(9.4)
  doc.setTextColor(...INK)
  doc.text(fitText(doc, boxer?.name || 'TBD', maxWidth), tx, y + 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.3)
  doc.setTextColor(...GRAY)
  doc.text(fitText(doc, boxer?.club || 'Individual', maxWidth), tx, y + 16.2)

  const meta = [boxer?.gender, boxer?.weight, boxer?.record].filter(Boolean).join(' · ')
  if (meta) {
    doc.setFontSize(5.7)
    doc.text(fitText(doc, meta, maxWidth), tx, y + 20.2)
  }
}

function drawFeatured(doc, { x, y, w, h, boxer, side, isMain, bye, resultLabel }) {
  const isRed = side === 'A'
  const soft = bye ? SLATE_SOFT : EMERALD_SOFT
  const border = bye ? [203, 213, 225] : EMERALD_BORDER
  const rail = bye ? LIGHT_GRAY : EMERALD
  const cornerLabel = isRed ? 'RED CORNER' : 'BLUE CORNER'

  doc.setFillColor(...soft)
  doc.setDrawColor(...border)
  doc.setLineWidth(0.35)
  if (bye) doc.setLineDashPattern([1.6, 1.2], 0)
  doc.roundedRect(x, y, w, h, 2.6, 2.6, 'FD')
  doc.setLineDashPattern([], 0)

  doc.setFillColor(...rail)
  doc.roundedRect(x, y + 0.2, 1.8, h - 0.4, 0.9, 0.9, 'F')

  const avatarSize = 22
  const avatarX = x + 5
  const avatarY = y + (h - avatarSize) / 2
  drawAvatar(doc, {
    x: avatarX,
    y: avatarY,
    size: avatarSize,
    radius: 3.6,
    photo: boxer?.photo || null,
    fill: bye ? GRAY : EMERALD,
    name: boxer?.name,
  })

  const resultWidth = resultLabel || bye ? 36 : 0
  const tx = avatarX + avatarSize + 4.5
  const maxWidth = x + w - 5 - (resultWidth ? resultWidth + 4 : 0) - tx

  const eyebrow = `${isMain ? 'MAIN EVENT · ' : ''}${cornerLabel}${bye ? ' · BYE' : ' WINNER'}`
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(5.8)
  doc.setTextColor(...(bye ? GRAY : EMERALD))
  doc.text(fitText(doc, eyebrow, w - 46), tx, y + 11)

  doc.setFontSize(14)
  doc.setTextColor(...INK)
  doc.text(fitText(doc, boxer?.name || 'TBD', maxWidth), tx, y + 18.6)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...GRAY)
  doc.text(fitText(doc, boxer?.club || 'Individual', maxWidth), tx, y + 24)

  const meta = [
    boxer?.gender,
    boxer?.weight,
    boxer?.record,
    boxer?.age ? `${boxer.age} yrs` : null,
    boxer?.nationality,
  ]
    .filter(Boolean)
    .join(' · ')
  if (meta) {
    doc.setFontSize(6.4)
    doc.text(fitText(doc, meta, maxWidth), tx, y + 28.8)
  }

  // Result / status box on the right.
  const rw = 36
  const rh = 17
  const rx = x + w - 5 - rw
  const ry = y + (h - rh) / 2
  doc.setFillColor(...INK)
  doc.roundedRect(rx, ry, rw, rh, 2.4, 2.4, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(4.8)
  doc.setTextColor(...LIGHT_GRAY)
  doc.text(bye ? 'STATUS' : 'WINNER', rx + 4, ry + 5.6)
  doc.setFontSize(7.4)
  doc.setTextColor(...WHITE)
  doc.text(fitText(doc, bye ? 'ADVANCES' : resultLabel || 'DECISION', rw - 8), rx + 4, ry + 11.8)
}

function drawBoutCard(doc, { x, y, w, bout, photos, isMain }) {
  const winnerRegId = bout.winnerId && typeof bout.winnerId === 'object' ? bout.winnerId._id : bout.winnerId
  const isWinnerA = winnerRegId && String(winnerRegId) === String(bout.boxerAId?._id)
  const isWinnerB = winnerRegId && String(winnerRegId) === String(bout.boxerBId?._id)
  const resultRecorded = !!bout.winnerId
  const hasA = !!bout.boxerAId?.boxerId?.fullName
  const hasB = !!bout.boxerBId?.boxerId?.fullName
  const hasBye = !hasA || !hasB
  const single = resultRecorded || hasBye
  const large = isMain && !single
  const bodyH = single ? 34 : large ? 36 : 28
  const h = HEADER_H + bodyH + CARD_PAD
  const meta = STATUS[bout.status] || STATUS.scheduled

  // Soft drop shadow.
  doc.setFillColor(...SLATE_SOFT)
  doc.roundedRect(x + 0.6, y + 0.9, w, h, 3, 3, 'F')

  // Card shell.
  doc.setFillColor(...WHITE)
  doc.setDrawColor(...LINE)
  doc.setLineWidth(0.35)
  doc.roundedRect(x, y, w, h, 3, 3, 'FD')

  // Header strip clipped to the rounded card outline.
  doc.saveGraphicsState()
  doc.roundedRect(x, y, w, h, 3, 3, null)
  doc.clip()
  doc.discardPath()
  doc.setFillColor(...(isMain ? INK : SOFT))
  doc.rect(x, y, w, HEADER_H, 'F')
  doc.restoreGraphicsState()

  doc.setDrawColor(...(isMain ? GOLD : LINE))
  doc.setLineWidth(isMain ? 0.5 : 0.3)
  doc.line(x, y + HEADER_H, x + w, y + HEADER_H)

  // Status rail down the left edge.
  doc.setFillColor(...meta.rail)
  doc.roundedRect(x, y + 0.2, 2, h - 0.4, 1, 1, 'F')

  const number = bout.boutNumber ?? ''
  drawBadge(doc, {
    x: x + CARD_PAD,
    y: y + 4.4,
    number,
    fill: isMain ? GOLD : INK,
    fg: isMain ? INK : WHITE,
  })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6)
  doc.setTextColor(...(isMain ? [203, 213, 225] : LIGHT_GRAY))
  doc.text(`BOUT #${number}`, x + CARD_PAD + 12, y + 7.7)

  // Real boxer category, falling back to the event category.
  const cat = bout.category || {}
  const aBoxer = boxerInfo(bout.boxerAId, photos)
  const bBoxer = boxerInfo(bout.boxerBId, photos)
  const weight = uniqueParts([aBoxer.weight || cat.weight, bBoxer.weight || cat.weight]).join(' / ')
  const ageCategory = uniqueParts([aBoxer.ageCategory || cat.age, bBoxer.ageCategory || cat.age]).join(' / ')
  const gender = uniqueParts([
    aBoxer.gender || genderLabel(cat.gender),
    bBoxer.gender || genderLabel(cat.gender),
  ]).join(' / ')
  const format = [
    bout.numberOfRounds ? `${bout.numberOfRounds}R` : null,
    bout.minutesPerRound ? `${bout.minutesPerRound} min` : null,
  ]
    .filter(Boolean)
    .join(' × ')

  const chipY = y + 10.2
  const chipLimit = x + w - CARD_PAD - (isMain ? 31 : 0)
  let cx = x + CARD_PAD + 12

  const chips = []
  if (bout.roundName) {
    chips.push(
      isMain
        ? { text: bout.roundName, bg: SLATE_700, fg: WHITE }
        : { text: bout.roundName, bg: [226, 232, 240], fg: SLATE_600 }
    )
  }
  if (weight) {
    chips.push(
      isMain
        ? { text: weight, bg: SLATE_700, fg: WHITE }
        : { text: weight, bg: WHITE, fg: INK, border: LINE }
    )
  }
  if (gender) {
    chips.push(
      isMain
        ? { text: gender, bg: SLATE_700, fg: WHITE }
        : { text: gender, bg: WHITE, fg: GRAY, border: LINE }
    )
  }
  if (ageCategory) {
    chips.push(
      isMain
        ? { text: ageCategory, bg: SLATE_700, fg: WHITE }
        : { text: ageCategory, bg: WHITE, fg: GRAY, border: LINE }
    )
  }
  if (format) {
    chips.push(
      isMain
        ? { text: format, bg: WHITE, fg: INK }
        : { text: format, bg: INK, fg: WHITE }
    )
  }

  for (const chip of chips) {
    const cw = chipWidth(doc, chip.text)
    if (cx + cw > chipLimit) break
    drawChip(doc, { ...chip, x: cx, y: chipY })
    cx += cw + 1.6
  }

  drawStatusPill(doc, bout.status, x + w - CARD_PAD, y + 4.6)

  if (isMain) {
    const mainW = chipWidth(doc, 'MAIN EVENT')
    drawChip(doc, {
      text: 'MAIN EVENT',
      x: x + w - CARD_PAD - mainW,
      y: chipY,
      bg: GOLD,
      fg: INK,
      size: 5.4,
      height: 4.6,
    })
  }

  const bodyY = y + HEADER_H
  const innerX = x + CARD_PAD
  const innerW = w - CARD_PAD * 2

  const method = bout.result?.method
  const resultLabel = method
    ? `${method}${bout.result?.round ? ` · R${bout.result.round}` : ''}`
    : ''

  if (resultRecorded) {
    const winnerReg = isWinnerA ? bout.boxerAId : isWinnerB ? bout.boxerBId : bout.boxerAId || bout.boxerBId
    drawFeatured(doc, {
      x: innerX,
      y: bodyY,
      w: innerW,
      h: bodyH,
      boxer: winnerReg?.boxerId?.fullName ? boxerInfo(winnerReg, photos) : boxerInfo(bout.boxerAId || bout.boxerBId, photos),
      side: isWinnerB ? 'B' : 'A',
      isMain,
      winner: true,
      bye: false,
      resultLabel,
    })
    return h
  }

  if (hasBye) {
    const reg = hasA ? bout.boxerAId : bout.boxerBId
    drawFeatured(doc, {
      x: innerX,
      y: bodyY,
      w: innerW,
      h: bodyH,
      boxer: boxerInfo(reg, photos),
      side: hasA ? 'A' : 'B',
      isMain,
      winner: false,
      bye: true,
      resultLabel: '',
    })
    return h
  }

  const vsGap = 12
  const cornerW = (innerW - vsGap) / 2

  drawCornerPanel(doc, {
    x: innerX,
    y: bodyY,
    w: cornerW,
    h: bodyH,
    boxer: aBoxer,
    side: 'A',
    large,
  })
  drawCornerPanel(doc, {
    x: innerX + innerW - cornerW,
    y: bodyY,
    w: cornerW,
    h: bodyH,
    boxer: bBoxer,
    side: 'B',
    large,
  })

  // Dashed divider + VS medallion.
  const midX = x + w / 2
  doc.setDrawColor(...LINE)
  doc.setLineWidth(0.3)
  doc.setLineDashPattern([1.2, 1.2], 0)
  doc.line(midX, bodyY + 4, midX, bodyY + bodyH - 4)
  doc.setLineDashPattern([], 0)

  const vsY = bodyY + bodyH / 2
  doc.setFillColor(...WHITE)
  doc.circle(midX, vsY, 5, 'F')
  doc.setFillColor(...INK)
  doc.circle(midX, vsY, 4.2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6)
  doc.setTextColor(...WHITE)
  doc.text('VS', midX, vsY + 2.1, { align: 'center' })

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

  // Brand logo for the document header and footer.
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
      doc.setFillColor(...INK)
      doc.rect(0, 0, pageW, 20, 'F')
      doc.setFillColor(...RED)
      doc.rect(0, 20, pageW, 1, 'F')

      if (logo) doc.addImage(logo.dataUrl, logo.format, M, 4.5, 10, 10)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9.5)
      doc.setTextColor(...WHITE)
      doc.text('BODYMAX', M + 13, 10)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6)
      doc.setTextColor(...BLUE_LIGHT)
      doc.text('OFFICIAL FIGHT CARD', M + 13, 13.6)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.6)
      doc.setTextColor(...WHITE)
      doc.text(fitText(doc, event?.name || 'Event', contentW * 0.55), pageW - M, 9.4, { align: 'right' })

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.2)
      doc.setTextColor(...LIGHT_GRAY)
      doc.text(fitText(doc, date || '', contentW * 0.55), pageW - M, 13.4, { align: 'right' })
      return 27
    }

    // Cover band.
    doc.setFillColor(...INK)
    doc.rect(0, 0, pageW, 44, 'F')

    // Decorative circles clipped to the band.
    doc.saveGraphicsState()
    doc.rect(0, 0, pageW, 44, null)
    doc.clip()
    doc.discardPath()
    doc.setFillColor(...SLATE_800)
    doc.circle(pageW - 8, -8, 34, 'F')
    doc.setFillColor(24, 34, 53)
    doc.circle(pageW - 52, 48, 26, 'F')
    doc.restoreGraphicsState()

    doc.setFillColor(...RED)
    doc.rect(0, 44, pageW, 1.2, 'F')

    if (logo) doc.addImage(logo.dataUrl, logo.format, M, 6, 13, 13)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...WHITE)
    doc.text('BODYMAX', M + 16, 12)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.2)
    doc.setTextColor(...BLUE_LIGHT)
    doc.text('OFFICIAL FIGHT CARD', M + 16, 16.4)

    // Tournament-style bout count tile.
    const tileW = 40
    const tileH = 17
    const tileX = pageW - M - tileW
    const tileY = 8
    doc.setFillColor(...SLATE_800)
    doc.setDrawColor(...SLATE_700)
    doc.setLineWidth(0.3)
    doc.roundedRect(tileX, tileY, tileW, tileH, 2.6, 2.6, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(5)
    doc.setTextColor(...LIGHT_GRAY)
    doc.text('TOTAL BOUTS', tileX + 4, tileY + 5.6)
    doc.setFontSize(13)
    doc.setTextColor(...WHITE)
    doc.text(String(bouts.length), tileX + 4, tileY + 13.6)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(...WHITE)
    doc.text(fitText(doc, event?.name || 'Event', contentW - 52), M, 28)

    if (metaLine) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.6)
      doc.setTextColor(...LIGHT_GRAY)
      doc.text(fitText(doc, metaLine, contentW - 52), M, 34.6)
    }

    // Section heading.
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...INK)
    doc.text('FIGHT CARD', M, 52)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.4)
    doc.setTextColor(...GRAY)
    doc.text(
      `${bouts.length} BOUT${bouts.length === 1 ? '' : 'S'} · ORDERED BY BOUT NUMBER`,
      pageW - M,
      52,
      { align: 'right' }
    )

    doc.setDrawColor(...LINE)
    doc.setLineWidth(0.3)
    doc.line(M, 54.5, pageW - M, 54.5)
    return 60
  }

  let y = drawPageHeader(false)

  bouts.forEach((bout, index) => {
    const isMain = index === bouts.length - 1
    const hasA = !!bout.boxerAId?.boxerId?.fullName
    const hasB = !!bout.boxerBId?.boxerId?.fullName
    const single = !!bout.winnerId || !hasA || !hasB
    const bodyH = single ? 34 : isMain ? 36 : 28
    const cardH = HEADER_H + bodyH + CARD_PAD

    if (y + cardH > pageH - 18) {
      doc.addPage()
      y = drawPageHeader(true)
    }

    drawBoutCard(doc, { x: M, y, w: contentW, bout, photos, isMain })
    y += cardH + CARD_GAP
  })

  // Page footers.
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setDrawColor(...LINE)
    doc.setLineWidth(0.3)
    doc.line(M, pageH - 12, pageW - M, pageH - 12)

    if (logo) doc.addImage(logo.dataUrl, logo.format, M, pageH - 9.6, 4.4, 4.4)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6)
    doc.setTextColor(...GRAY)
    doc.text('BODYMAX · OFFICIAL FIGHT CARD', M + 6.4, pageH - 6.4)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.2)
    doc.text(`Page ${i} of ${pageCount}`, pageW - M, pageH - 6.4, { align: 'right' })
  }

  const safeName = (event?.name || 'event')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()

  return { doc, fileName: `fight-card-${safeName}.pdf` }
}
