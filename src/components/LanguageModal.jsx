export function LanguageModal({ open, onSelect }) {
  if (!open) return null

  const options = [
    {
      code: 'en',
      name: 'English',
      sub: 'Continue in English',
    },
    {
      code: 'rw',
      name: 'Kinyarwanda',
      sub: 'Komeza mu kinyarwanda',
    },
  ]

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="bg-slate-950 px-6 py-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3" />
            </svg>
          </span>
          <h2 className="mt-4 text-lg font-bold text-white">Choose your language</h2>
          <p className="mt-1 text-sm text-slate-400">Hitamo ururimi</p>
        </div>
        <div className="grid gap-3 p-5">
          {options.map((opt) => (
            <button
              key={opt.code}
              type="button"
              onClick={() => onSelect(opt.code)}
              className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-left transition hover:border-brand-500 hover:bg-brand-50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-600 transition group-hover:bg-brand-600 group-hover:text-white">
                {opt.code === 'en' ? 'EN' : 'RW'}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-slate-900">{opt.name}</span>
                <span className="block text-sm text-slate-500">{opt.sub}</span>
              </span>
              <svg className="h-5 w-5 text-slate-300 transition group-hover:text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}