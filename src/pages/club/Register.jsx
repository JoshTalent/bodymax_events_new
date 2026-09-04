import { Fragment, useEffect, useState } from 'react'
import { api } from '../../utils/api.js'
import { useToast } from '../../context/ToastContext.jsx'
import { Button } from '../../components/Button.jsx'
import { Card } from '../../components/Card.jsx'
import { Loading, Empty, Spinner } from '../../components/Loading.jsx'
import { StatusBadge, Badge } from '../../components/Badge.jsx'
import { Modal } from '../../components/Modal.jsx'
import { cn } from '../../utils/cn.js'

function PayInfo({ event }) {
  const acc = event.paymentAccount || {}
  return (
    <div className="mt-3 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4">
      <div className="flex items-center gap-2">
        <svg className="h-5 w-5 text-brand-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h2m4 0h4M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <p className="text-sm font-semibold text-slate-900">Where to Send the Fee</p>
      </div>
      <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {acc.bankName && (
          <div className="flex justify-between"><dt className="text-slate-500">Bank</dt><dd className="font-medium text-slate-900">{acc.bankName}</dd></div>
        )}
        {acc.accountName && (
          <div className="flex justify-between"><dt className="text-slate-500">Account Name</dt><dd className="font-medium text-slate-900">{acc.accountName}</dd></div>
        )}
        {acc.accountNumber && (
          <div className="flex justify-between"><dt className="text-slate-500">Account No.</dt><dd className="rounded bg-white px-1.5 font-mono font-semibold text-brand-800">{acc.accountNumber}</dd></div>
        )}
      </dl>
      {acc.acceptedMethods?.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-500">Accepted:</span>
          {acc.acceptedMethods.map((m) => <Badge key={m} tone="blue">{m}</Badge>)}
        </div>
      )}
      {acc.paymentInstructions && (
        <p className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-xs text-slate-600">
          <span className="font-semibold text-slate-900">Instructions:</span> {acc.paymentInstructions}
        </p>
      )}
    </div>
  )
}

function ContactCard({ contact }) {
  if (!contact?.phone && !contact?.email && !contact?.name) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <svg className="h-5 w-5 text-brand-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13.5V9a2 2 0 00-2-2H6a2 2 0 00-2 2v4.5m16 0a1 1 0 01-1 1h-2l-2 3v-3H5a1 1 0 01-1-1m1-1h.01M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
        <p className="text-sm font-semibold text-slate-900">Promoter Contact</p>
      </div>
      <dl className="mt-3 space-y-1.5 text-sm">
        {contact.name && <div className="flex justify-between"><dt className="text-slate-500">Name</dt><dd className="font-medium text-slate-900">{contact.name}</dd></div>}
        {contact.phone && <div className="flex justify-between"><dt className="text-slate-500">Phone / WhatsApp</dt><dd className="font-medium text-brand-800">{contact.phone}</dd></div>}
        {contact.email && <div className="flex justify-between"><dt className="text-slate-500">Email</dt><dd className="font-medium text-brand-800">{contact.email}</dd></div>}
      </dl>
    </div>
  )
}

const chevronRight = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)
const chevronLeft = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
)
const checkIcon = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

function Stepper({ step }) {
  const steps = [
    { n: 1, label: 'Event' },
    { n: 2, label: 'Boxers' },
    { n: 3, label: 'Confirm' },
  ]
  return (
    <div className="flex items-center">
      {steps.map((s, i) => (
        <Fragment key={s.n}>
          {i > 0 && (
            <div className={cn('mx-1 h-0.5 flex-1 rounded-full sm:mx-2', step >= i ? 'bg-brand-600' : 'bg-slate-200')} />
          )}
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition sm:h-10 sm:w-10',
                step >= s.n ? 'bg-brand-600 text-white shadow-md shadow-blue-200' : 'bg-slate-200 text-slate-500'
              )}
            >
              {step > s.n ? checkIcon : s.n}
            </div>
            <span className={cn('text-xs font-medium', step >= s.n ? 'text-slate-900' : 'text-slate-400')}>{s.label}</span>
          </div>
        </Fragment>
      ))}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-slate-900">{value}</dd>
    </div>
  )
}

export default function ClubRegister() {
  const { toast } = useToast()
  const [events, setEvents] = useState(null)
  const [boxers, setBoxers] = useState(null)
  const [registrations, setRegistrations] = useState(null)
  const [step, setStep] = useState(0)
  const [selEvent, setSelEvent] = useState('')
  const [selectedBoxers, setSelectedBoxers] = useState([])
  const [boxerCats, setBoxerCats] = useState({})
  const [payModal, setPayModal] = useState(null)
  const [busy, setBusy] = useState(false)
  const [lastSummary, setLastSummary] = useState(null)

  const load = () => {
    api('/events').then((d) => setEvents(d.events)).catch(() => {})
    api('/boxers').then((d) => setBoxers(d.boxers)).catch(() => {})
    api('/registrations').then((d) => setRegistrations(d.registrations)).catch(() => {})
  }
  useEffect(load, [])

  if (!events || !boxers || !registrations) return <Loading />

  const openEvents = events.filter((e) => e.registrationOpen)
  const activeEvent = events.find((e) => e._id === selEvent)

  const alreadyRegisteredBoxerIds = new Set(registrations.filter((r) => r.eventId?._id === selEvent).map((r) => r.boxerId?._id))

  const feeType = activeEvent?.feeStructure?.type
  const feeAmount = Number(activeEvent?.feeStructure?.amount) || 0
  const feePerBoxer = feeType === 'per_boxer' ? feeAmount : 0
  const requiresPayment = !!activeEvent && !!feeType && feeType !== 'none' && feeAmount > 0
  const perBoxerTotal = feePerBoxer * selectedBoxers.length
  const totalFee = feeType === 'per_club' ? (selectedBoxers.length > 0 ? feeAmount : 0) : perBoxerTotal

  const eventWeightCats = activeEvent?.weightCategories || []
  const eventAgeCats = activeEvent?.ageCategories || []
  const needsWeightCat = eventWeightCats.length > 0
  const needsAgeCat = eventAgeCats.length > 0

  const toggleSelect = (bid) => {
    if (selectedBoxers.includes(bid)) {
      setSelectedBoxers(selectedBoxers.filter((x) => x !== bid))
    } else {
      const b = boxers.find((x) => x._id === bid)
      setSelectedBoxers([...selectedBoxers, bid])
      setBoxerCats((prev) => ({
        ...prev,
        [bid]: {
          weight: eventWeightCats.includes(b?.weightCategory) ? b.weightCategory : '',
          age: eventAgeCats.includes(b?.ageCategory) ? b.ageCategory : '',
          gender: b?.gender || 'M',
        },
      }))
    }
  }

  const setCat = (bid, key) => (e) => setBoxerCats((prev) => ({ ...prev, [bid]: { ...prev[bid], [key]: e.target.value } }))

  const selectedBoxerList = boxers.filter((b) => selectedBoxers.includes(b._id))

  const submitRegistration = async () => {
    for (const bid of selectedBoxers) {
      const cat = boxerCats[bid] || {}
      if (needsWeightCat && !cat.weight) {
        toast('Choose a weight category for every selected boxer', 'error')
        return
      }
      if (needsAgeCat && !cat.age) {
        toast('Choose an age category for every selected boxer', 'error')
        return
      }
    }
    setBusy(true)
    try {
      for (const bid of selectedBoxers) {
        const cat = boxerCats[bid] || {}
        await api('/registrations', {
          method: 'POST',
          body: {
            eventId: selEvent,
            boxerId: bid,
            category: { weight: cat.weight || '', age: cat.age || '', gender: cat.gender || 'M' },
          },
        })
      }
      toast(`${selectedBoxers.length} boxer(s) registered`)
      setLastSummary({
        event: activeEvent,
        fee: totalFee,
        perBoxer: feePerBoxer,
        requiresPayment,
      })
      setSelectedBoxers([])
      setBoxerCats({})
      setStep(3)
      load()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const chooseEvent = (val) => {
    setSelEvent(val)
    setSelectedBoxers([])
    setBoxerCats({})
  }

  const feeLabel = activeEvent
    ? requiresPayment
      ? `${activeEvent.feeStructure.amount} ${activeEvent.feeStructure.currency}${feeType === 'per_boxer' ? ' / boxer' : ' per club'}`
      : 'Free'
    : ''

  const hasPayInfo = (ev) => {
    const acc = ev?.paymentAccount || {}
    const c = ev?.promoterContact || {}
    return !!(acc.accountNumber || acc.accountName || acc.bankName || c.phone || c.email || c.name)
  }

  const ActionBar = ({ onBack, children }) => (
    <div className="sticky bottom-20 z-20 mt-6 md:static">
      <div className="flex items-stretch gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur md:border-0 md:bg-transparent md:p-0 md:shadow-none">
        {onBack && (
          <button
            onClick={onBack}
            className="flex h-12 shrink-0 items-center gap-1 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-600"
          >
            {chevronLeft} Back
          </button>
        )}
        {children}
      </div>
    </div>
  )

  return (
    <div className="pb-4">
      {step < 3 && (
        <div className="relative mb-6 overflow-hidden rounded-2xl bg-slate-900 px-5 py-6 text-white sm:px-6">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-600/30 blur-2xl" />
          <div className="relative">
            <h1 className="text-xl font-bold sm:text-2xl">Register for Events</h1>
            <p className="mt-1 text-sm text-slate-300">Three simple steps: pick an event, select boxers, confirm.</p>
          </div>
        </div>
      )}

      {step < 3 && (
        <div className="mb-5"><Stepper step={step} /></div>
      )}

      {/* STEP 1 — EVENT */}
      {step === 0 && (
        <>
          <div className="mt-0">
            <h2 className="mb-1 text-lg font-bold text-slate-900">Choose an event</h2>
            <p className="mb-4 text-sm text-slate-500">Events currently open for registration.</p>
          </div>

          <Card className="p-4 sm:p-5">
            <div className="relative">
              <select
                value={selEvent}
                onChange={(e) => chooseEvent(e.target.value)}
                className={cn(
                  'w-full appearance-none rounded-xl border bg-white py-3.5 pl-4 pr-10 text-base font-medium text-slate-900 focus:outline-none focus:ring-2',
                  selEvent ? 'border-brand-500 focus:ring-brand-500' : 'border-slate-300 focus:ring-brand-500'
                )}
              >
                <option value="">Select an event…</option>
                {openEvents.map((e) => (
                  <option key={e._id} value={e._id}>{e.name}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">{chevronRight}</span>
            </div>

            {!selEvent && openEvents.length === 0 && (
              <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                No events are open for registration right now. New events appear here as soon as a promoter opens them.
              </p>
            )}

            {activeEvent && (
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">{activeEvent.name}</h3>
                  <StatusBadge status={activeEvent.status} />
                </div>
                <dl className="mt-1 divide-y divide-slate-100">
                  <Row label="Date" value={activeEvent.eventDate ? new Date(activeEvent.eventDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '—'} />
                  <Row label="Venue" value={`${activeEvent.venue || '—'}${activeEvent.location ? `, ${activeEvent.location}` : ''}`} />
                  <Row label="Registration closes" value={activeEvent.registrationDeadline ? new Date(activeEvent.registrationDeadline).toLocaleDateString() : '—'} />
                  <Row label="Weigh-In" value={activeEvent.weighInDate ? new Date(activeEvent.weighInDate).toLocaleDateString() : '—'} />
                </dl>
                <div className="mt-2 flex items-center justify-between rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-3 text-white">
                  <span className="text-sm font-medium text-slate-300">Entry fee</span>
                  <span className="text-lg font-bold">{feeLabel}</span>
                </div>
                {activeEvent.feeStructure?.notes && (
                  <p className="mt-2 text-xs text-slate-500">{activeEvent.feeStructure.notes}</p>
                )}
              </div>
            )}
          </Card>

          <ActionBar>
            <Button size="lg" className="h-12 flex-1" disabled={!selEvent} onClick={() => setStep(1)}>
              Continue {chevronRight}
            </Button>
          </ActionBar>
        </>
      )}

      {/* STEP 2 — BOXERS */}
      {step === 1 && (
        <>
          <div className="mt-0">
            <h2 className="mb-1 text-lg font-bold text-slate-900">Select your boxers</h2>
            <p className="mb-4 text-sm text-slate-500">
              Tick the boxers to enter{selectedBoxers.length > 0 ? ` — ${selectedBoxers.length} selected` : ''}.
            </p>
          </div>

          <Card className="p-4 sm:p-5">
            {boxers.length === 0 ? (
              <Empty title="No boxers in your database" message="Add boxers first, then return here to register them." />
            ) : (
              <ul className="divide-y divide-slate-200">
                {boxers.map((b) => {
                  const already = alreadyRegisteredBoxerIds.has(b._id)
                  const checked = selectedBoxers.includes(b._id)
                  return (
                    <li key={b._id} className={cn('py-3', already && 'opacity-60')}>
                      <button
                        type="button"
                        disabled={already}
                        onClick={() => toggleSelect(b._id)}
                        className="flex w-full items-center gap-3 text-left"
                      >
                        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold', b.gender === 'F' ? 'bg-blue-100 text-brand-800' : 'bg-slate-900 text-white')}>
                          {b.fullName?.split(' ').map((w) => w[0]).slice(0, 2).join('') || '?'}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-slate-900">{b.fullName}</span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
                            <Badge tone={b.gender === 'F' ? 'blue' : 'dark'}>{b.gender === 'F' ? 'Female' : 'Male'}</Badge>
                            {b.weightCategory && <span>{b.weightCategory}</span>}
                            {b.registeredWeightKg && <span className="text-slate-400">· {b.registeredWeightKg}kg</span>}
                            {b.ageCategory && <span className="text-slate-400">· {b.ageCategory}</span>}
                          </span>
                        </span>
                        {already ? (
                          <span className="shrink-0 text-xs font-semibold text-brand-700">Registered</span>
                        ) : (
                          <span
                            className={cn(
                              'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition',
                              checked ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white text-transparent'
                            )}
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        )}
                      </button>
                      {checked && (needsWeightCat || needsAgeCat) && (
                        <div className="mt-3 ml-[52px] grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-2">
                          {needsWeightCat && (
                            <div>
                              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Weight Category *</label>
                              <select
                                value={boxerCats[b._id]?.weight || ''}
                                onChange={setCat(b._id, 'weight')}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
                              >
                                <option value="">Select weight category</option>
                                {eventWeightCats.map((c) => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            </div>
                          )}
                          {needsAgeCat && (
                            <div>
                              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Age Category *</label>
                              <select
                                value={boxerCats[b._id]?.age || ''}
                                onChange={setCat(b._id, 'age')}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
                              >
                                <option value="">Select age category</option>
                                {eventAgeCats.map((c) => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          <ActionBar onBack={() => setStep(0)}>
            <Button size="lg" className="h-12 flex-1" disabled={selectedBoxers.length === 0} onClick={() => setStep(2)}>
              Continue ({selectedBoxers.length} selected) {chevronRight}
            </Button>
          </ActionBar>
        </>
      )}

      {/* STEP 3 — CONFIRM */}
      {step === 2 && activeEvent && (
        <>
          <div className="mt-0">
            <h2 className="mb-1 text-lg font-bold text-slate-900">Review & confirm</h2>
            <p className="mb-4 text-sm text-slate-500">Check the details before submitting.</p>
          </div>

          <Card className="p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Event</p>
            <p className="mt-1 text-base font-bold text-slate-900">{activeEvent.name}</p>
            <p className="text-sm text-slate-500">
              {activeEvent.eventDate ? new Date(activeEvent.eventDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : ''}
              {activeEvent.location && ` · ${activeEvent.location}`}
            </p>

            <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">Boxers ({selectedBoxerList.length})</p>
            <ul className="mt-2 divide-y divide-slate-100">
              {selectedBoxerList.map((b) => {
                const cat = boxerCats[b._id] || {}
                return (
                  <li key={b._id} className="flex items-center justify-between gap-3 py-2">
                    <span className="font-medium text-slate-900">{b.fullName}</span>
                    <span className="text-sm text-slate-500">
                      {[cat.gender === 'F' ? 'Female' : 'Male', cat.weight, cat.age].filter(Boolean).join(' · ') || '—'}
                    </span>
                  </li>
                )
              })}
            </ul>

            <div className="mt-5 flex items-center justify-between rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-3 text-white">
              <span className="text-sm font-medium text-slate-300">
                Total{requiresPayment && feeType === 'per_boxer' ? ` (${selectedBoxerList.length} × ${feePerBoxer})` : ''}
              </span>
              <span className="text-lg font-bold">
                {requiresPayment ? `${totalFee} ${activeEvent.feeStructure?.currency}` : 'Free'}
              </span>
            </div>
          </Card>

          {requiresPayment && (
            <Card className="mt-4 p-4 sm:p-5">
              <p className="text-sm font-bold text-slate-900">How to pay</p>
              <p className="mt-0.5 text-sm text-slate-500">
                Send {totalFee} {activeEvent.feeStructure?.currency} to the account below, then submit the details after registering.
              </p>
              <PayInfo event={activeEvent} />
              <div className="mt-3">
                <ContactCard contact={activeEvent.promoterContact} />
              </div>
            </Card>
          )}

          <ActionBar onBack={() => setStep(1)}>
            <Button size="lg" className="h-12 flex-1" onClick={submitRegistration} disabled={busy}>
              {busy ? <Spinner className="h-5 w-5 border-white" /> : `Confirm Registration${requiresPayment ? ` · ${totalFee} ${activeEvent.feeStructure?.currency}` : ''}`}
            </Button>
          </ActionBar>
        </>
      )}

      {/* SUCCESS */}
      {step === 3 && (
        <Card className="p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <svg className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-900">Registration Submitted!</h2>
          <p className="mt-1 text-sm text-slate-500">
            Your boxers have been entered for {lastSummary?.event?.name}. A promoter will confirm them shortly — check the list below for their status.
          </p>
          {lastSummary?.requiresPayment && lastSummary?.event && (
            <>
              <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-left">
                <p className="text-sm font-semibold text-slate-900">
                  Pay {lastSummary.fee} {lastSummary.event.feeStructure?.currency} to complete your entry
                </p>
                <p className="mt-0.5 text-sm text-slate-600">
                  Send the fee to the promoter account below. Once the promoter confirms the payment, all your boxers are marked as paid automatically.
                </p>
              </div>
              {hasPayInfo(lastSummary.event) && (
                <>
                  <div className="mt-3 text-left"><PayInfo event={lastSummary.event} /></div>
                  <div className="mt-3 text-left"><ContactCard contact={lastSummary.event.promoterContact} /></div>
                </>
              )}
            </>
          )}
          <Button size="lg" className="mt-6 w-full sm:w-auto" onClick={() => { setStep(0); setSelEvent(''); setLastSummary(null) }}>
            Done — register more boxers
          </Button>
        </Card>
      )}

      {/* MY REGISTRATIONS */}
      <Card className="mt-6 p-0">
        <div className="border-b border-slate-200 bg-slate-50/60 px-5 py-3">
          <h3 className="font-semibold text-slate-900">My Registrations</h3>
          <p className="text-xs text-slate-500">Track approval status and how to pay your entry fee</p>
        </div>
        {registrations.length === 0 ? (
          <div className="p-6">
            <Empty title="No registrations yet" />
          </div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {registrations.map((r) => (
              <li key={r._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{r.boxerId?.fullName} — {r.eventId?.name}</p>
                  <p className="text-sm text-slate-500">
                    Category: {r.category?.weight || '—'}
                  </p>
                  {r.payment?.status === 'pending' && (
                    <p className="mt-1 text-xs text-blue-700">Awaiting payment — pay the fee so the promoter can confirm your entry.</p>
                  )}
                  {r.payment?.status === 'confirmed' && (
                    <p className="mt-1 text-xs text-emerald-700">Payment confirmed — entry complete.</p>
                  )}
                  {r.promoterFeedback && <p className="mt-1 text-xs text-slate-800">Feedback: {r.promoterFeedback}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={r.status} />
                  {r.payment?.status === 'confirmed' && <StatusBadge status="confirmed" />}
                  {!['not_required', 'confirmed'].includes(r.payment?.status) && hasPayInfo(r.eventId) && (
                    <Button size="sm" variant="secondary" onClick={() => setPayModal(r)}>How to Pay</Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={!!payModal}
        onClose={() => setPayModal(null)}
        title={`How to Pay — ${payModal?.eventId?.name || 'Event'}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPayModal(null)}>Close</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Pay the entry fee to the promoter account below. Once received, the promoter confirms it and all your registered boxers for{' '}
          <span className="font-medium text-slate-900">{payModal?.eventId?.name || 'this event'}</span> are marked as paid at once.
        </p>
        <div className="mt-4"><PayInfo event={payModal?.eventId} /></div>
        <div className="mt-3"><ContactCard contact={payModal?.eventId?.promoterContact} /></div>
      </Modal>
    </div>
  )
}