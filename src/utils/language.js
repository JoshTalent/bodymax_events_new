const LANGUAGE_KEY = 'bodymax_lang'

export function getSavedLang() {
  try {
    const v = localStorage.getItem(LANGUAGE_KEY)
    return v === 'en' || v === 'rw' ? v : null
  } catch {
    return null
  }
}

export function persistLang(lang) {
  try {
    localStorage.setItem(LANGUAGE_KEY, lang)
  } catch {}
}