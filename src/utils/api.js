const BASE_URL = '/.netlify/functions'

// Netlify classic functions expose each file as a flat dash-named endpoint.
// Map the human-friendly paths to the flat function names.
const PATH_MAP = {
  '/auth/login': '/auth-login',
  '/auth/me': '/auth-me',
  '/auth/update': '/auth-update',
  '/users/create': '/users-create',
  '/events/create': '/events-create',
  '/events/update': '/events-update',
  '/registrations/manage': '/registrations-manage',
  '/registrations/payment': '/registrations-payment',
  '/registrations/bulk': '/registrations-bulk',
  '/weighins/record': '/weighins-record',
  '/draws/manual': '/draws-manual',
  '/draws/get': '/draws-get',
  '/draws/boxer': '/draws-boxer',
  '/results/record': '/results-record',
  '/role-links': '/role-links',
  '/portal': '/role-portal',
  '/event-register': '/event-register',
}

function normalizePath(path) {
  // Extract the base path (before ?) to look up the map
  const [base, query] = path.split('?')
  if (PATH_MAP[base]) {
    return PATH_MAP[base] + (query ? `?${query}` : '')
  }
  return path
}

function getToken() {
  return localStorage.getItem('bodymax_token')
}

export async function api(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${normalizePath(path)}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const contentType = res.headers.get('content-type') || ''
  const data = contentType.includes('application/json')
    ? await res.json()
    : { message: await res.text() }

  if (!res.ok) {
    const error = new Error(data.message || 'Something went wrong')
    error.status = res.status
    throw error
  }

  return data
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('bodymax_token', token)
  } else {
    localStorage.removeItem('bodymax_token')
  }
}
