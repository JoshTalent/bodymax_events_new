import nodemailer from 'nodemailer'

export function getTransport() {
  const user = process.env.SMTP_USER || process.env.GMAIL_USER
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_APP
  if (!user || !pass) {
    const err = new Error(
      'Email sending is not configured. Set SMTP_USER and SMTP_PASS (or GMAIL_USER and GMAIL_APP_PASSWORD) on Netlify.'
    )
    err.status = 500
    throw err
  }

  const host = process.env.SMTP_HOST
  if (host) {
    const port = Number(process.env.SMTP_PORT || 587)
    const secure = process.env.SMTP_SECURE === undefined ? port === 465 : String(process.env.SMTP_SECURE) === 'true'
    return nodemailer.createTransport({ host, port, secure, auth: { user, pass } })
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  })
}

export function getFrom() {
  const name = process.env.SMTP_FROM_NAME || 'Bodymax Events'
  const email = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || process.env.GMAIL_USER || ''
  return `"${name}" <${email}>`
}

export function getReplyTo() {
  return process.env.SMTP_REPLY_TO || process.env.SMTP_USER || process.env.GMAIL_USER || ''
}