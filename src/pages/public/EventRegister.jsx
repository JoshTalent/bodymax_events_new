import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../utils/api.js'
import { Loading } from '../../components/Loading.jsx'
import { Button } from '../../components/Button.jsx'
import { Modal } from '../../components/Modal.jsx'
import { Input, Select } from '../../components/Field.jsx'
import { cn } from '../../utils/cn.js'

const EMPTY_BOXER = { fullName: '', weight: '', age: '', gender: '', numberOfBouts: 1 }

const text = {
  en: {
    eventRegistration: 'Event Registration',
    registrationOpen: 'Registration open',
    registrationClosed: 'Registration closed',
    venue: 'Venue',
    yourClub: 'Your club',
    clubSub: 'The boxing club or team these boxers belong to',
    clubLabel: 'Club / Team Name',
    clubPlaceholder: 'e.g. Midlands Boxing Club',
    boxers: 'Boxers',
    added: (n) => `${n} added`,
    boxerNum: (n) => `Boxer ${n}`,
    remove: 'Remove',
    fullName: 'Full Name',
    fullNamePlaceholder: "Boxer's full name",
    weightCategory: 'Weight Category',
    selectWeight: 'Select weight…',
    ageCategory: 'Age Category',
    selectAge: 'Select age…',
    gender: 'Gender',
    selectGender: 'Select gender…',
    male: 'Male',
    female: 'Female',
    numberOfBouts: 'Number of Bouts',
    addAnother: 'Add another boxer',
    submit: (n) => (n === 1 ? 'Submit 1 boxer' : `Submit ${n} boxers`),
    submitting: 'Submitting…',
    closedTitle: 'Registration is closed',
    closedBody: 'This event is no longer accepting boxer registrations.',
    linkUnavailable: 'Registration link unavailable',
    back: 'Back to Bodymax',
    thankTitle: 'Registration submitted',
    thankYou: 'Thank you!',
    thankBody: (name) =>
      `Your boxer(s) have been registered for ${name}. The event promoter will review and confirm each entry.`,
    close: 'Close',
  },
  rw: {
    eventRegistration: 'Iyandikisha ry’ibirori',
    registrationOpen: 'Iyandikisha riracyafunguye',
    registrationClosed: 'Iyandikisha ryafunze',
    venue: 'Aho bizobera',
    yourClub: 'Ikipe yawe',
    clubSub: 'Ikipe cyangwa itsinda abakinnyi barimo',
    clubLabel: 'Izina ry’ikipe / itsinda',
    clubPlaceholder: 'urugero: Midlands Boxing Club',
    boxers: 'Abakinnyi',
    added: (n) => `${n} byongewe`,
    boxerNum: (n) => `Umukinnyi wa ${n}`,
    remove: 'Hanagura',
    fullName: 'Amazina yuzuye',
    fullNamePlaceholder: 'Amazina yuzuye y’umukinnyi',
    weightCategory: 'Icyiciro cy’uburemere',
    selectWeight: 'Hitamo uburemere…',
    ageCategory: 'Icyiciro cy’imyaka',
    selectAge: 'Hitamo imyaka…',
    gender: 'Igitsina',
    selectGender: 'Hitamo igitsina…',
    male: 'Gabo',
    female: 'Gore',
    numberOfBouts: 'Umubare w’imikino',
    addAnother: 'Ongera undi mukinnyi',
    submit: (n) => (n === 1 ? 'Ohereza umukinnyi 1' : `Ohereza abakinnyi ${n}`),
    submitting: 'Birimo koherezwa…',
    closedTitle: 'Iyandikisha ryafunze',
    closedBody: 'Iki birori nticyemera kongera kwiyandikisha abakinnyi.',
    linkUnavailable: 'Uhuza rwo kwiyandikisha ntirukoreshwa',
    back: 'Subira kuri Bodymax',
    thankTitle: 'Iyandikisha ryakozwe',
    thankYou: 'Urakoze!',
    thankBody: (name) => `Abakinnyi bawe biyandikishije muri ${name}. Umuyobozi w’ibirori azasuzuma kandi yemeze buri wese.`,
    close: 'Funga',
  },
}

export default function EventRegister() {
  const { token } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [clubName, setClubName] = useState('')
  const [boxers, setBoxers] = useState([{ ...EMPTY_BOXER }])
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [lang, setLang] = useState('en')
  const t = lang === 'rw' ? text.rw : text.en

  useEffect(() => {
    api(`/event-register?token=${token}`)
      .then((d) => setEvent(d.event))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  const updateBoxer = (i, key, value) => {
    setBoxers((bs) => bs.map((b, idx) => (idx === i ? { ...b, [key]: value } : b)))
  }

  const addBoxer = () => setBoxers((bs) => [...bs, { ...EMPTY_BOXER }])

  const removeBoxer = (i) => {
    setBoxers((bs) => (bs.length === 1 ? bs : bs.filter((_, idx) => idx !== i)))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const filtered = boxers.map((b) => ({
        ...b,
        fullName: (b.fullName || '').trim(),
        numberOfBouts: Number(b.numberOfBouts) || 1,
      }))
      const res = await api(`/event-register?token=${token}`, {
        method: 'POST',
        body: { clubName: clubName.trim(), boxers: filtered },
      })
      setDone(true)
    } catch (err) {
      setError(err.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSaving(false)
    }
  }

  const closeThankYou = () => {
    setDone(false)
    setBoxers([{ ...EMPTY_BOXER }])
    setClubName('')
  }

  const LangToggle = () => (
    <div className="flex items-center rounded-full bg-white/10 p-0.5 ring-1 ring-white/20">
      {(['en', 'rw']).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-semibold transition',
            lang === code ? 'bg-white text-slate-900' : 'text-slate-200 hover:text-white'
          )}
        >
          {code === 'en' ? 'EN' : 'Kinyarwanda'}
        </button>
      ))}
    </div>
  )

  if (loading) return <Loading />

  if (error && !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">{t.linkUnavailable}</h1>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
          <Link to="/" className="mt-6 inline-block text-sm font-medium text-brand-600 hover:underline">← {t.back}</Link>
        </div>
      </div>
    )
  }

  const closed = !event.registrationOpen || ['closed', 'completed', 'archived'].includes(event.status)

  const submitText = saving ? t.submitting : t.submit(boxers.length)

  const submitButton = (
    <Button type="submit" form="event-register-form" disabled={saving} className="w-full py-3 text-base shadow-lg shadow-brand-600/25">
      {saving ? (
        <span className="inline-flex items-center gap-2">
          <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t.submitting}
        </span>
      ) : (
        submitText
      )}
    </Button>
  )

  return (
    <div className="min-h-screen bg-slate-100 pb-28 sm:pb-16">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 px-4 py-8 text-white sm:py-10">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-brand-400/20 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-2xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-brand-200">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              {t.eventRegistration}
            </div>
            <LangToggle />
          </div>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{event.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-100 ring-1 ring-white/20 backdrop-blur">
              {closed ? t.registrationClosed : t.registrationOpen}
            </span>
            {event.venue && (
              <span className="inline-flex items-center gap-1.5 text-sm text-slate-300">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                {event.venue}
              </span>
            )}
            {event.eventDate && (
              <span className="inline-flex items-center gap-1.5 text-sm text-slate-300">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                {new Date(event.eventDate).toLocaleDateString(lang === 'rw' ? 'rw-RW' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-4 pt-6 sm:pt-8">
        {closed ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">{t.closedTitle}</h2>
            <p className="mt-1 text-sm text-slate-500">{t.closedBody}</p>
          </div>
        ) : (
          <form id="event-register-form" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{t.yourClub}</h2>
                    <p className="text-sm text-slate-500">{t.clubSub}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Input
                    label={t.clubLabel}
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    placeholder={t.clubPlaceholder}
                    required
                  />
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">{t.boxers}</h2>
                  <span className="text-xs text-slate-400">{t.added(boxers.length)}</span>
                </div>

                {boxers.map((b, i) => (
                  <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                          {i + 1}
                        </span>
                        <h3 className="font-semibold text-slate-900">{t.boxerNum(i + 1)}</h3>
                      </div>
                      {boxers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBoxer(i)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                          {t.remove}
                        </button>
                      )}
                    </div>

                    <div className="space-y-4 p-5">
                      <Input
                        label={t.fullName}
                        value={b.fullName}
                        onChange={(e) => updateBoxer(i, 'fullName', e.target.value)}
                        required
                        placeholder={t.fullNamePlaceholder}
                      />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Select label={t.weightCategory} value={b.weight} onChange={(e) => updateBoxer(i, 'weight', e.target.value)} required>
                          <option value="">{t.selectWeight}</option>
                          {event.weightCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                        </Select>
                        <Select label={t.ageCategory} value={b.age} onChange={(e) => updateBoxer(i, 'age', e.target.value)} required>
                          <option value="">{t.selectAge}</option>
                          {event.ageCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                        </Select>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Select label={t.gender} value={b.gender} onChange={(e) => updateBoxer(i, 'gender', e.target.value)} required>
                          <option value="">{t.selectGender}</option>
                          <option value="M">{t.male}</option>
                          <option value="F">{t.female}</option>
                        </Select>
                        <Input
                          label={t.numberOfBouts}
                          type="number"
                          min="1"
                          required
                          value={b.numberOfBouts}
                          onChange={(e) => updateBoxer(i, 'numberOfBouts', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </section>

              <button
                type="button"
                onClick={addBoxer}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white px-4 py-4 text-sm font-semibold text-slate-500 transition hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                {t.addAnother}
              </button>

              {error && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <svg className="mt-0.5 h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  {error}
                </div>
              )}

              <div className="hidden sm:block">{submitButton}</div>
            </div>
          </form>
        )}
      </main>

      {!closed && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3 shadow-[0_-2px_16px_rgba(0,0,0,0.06)] backdrop-blur-md sm:hidden"
        >
          {submitButton}
        </div>
      )}

      <Modal
        open={done}
        onClose={closeThankYou}
        title={t.thankTitle}
        footer={
          <Button onClick={closeThankYou} className="w-full py-2.5">{t.close}</Button>
        }
      >
        <div className="py-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-5 text-2xl font-bold text-slate-900">{t.thankYou}</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
            {t.thankBody(event?.name)}
          </p>
        </div>
      </Modal>
    </div>
  )
}