export async function normalizeRequest(event) {
  // Legacy Netlify function event (has httpMethod)
  if (event && typeof event.httpMethod === 'string') {
    return event
  }

  // Modern web-standard Request object passed by Netlify's runtime
  const url = new URL(event.url)
  const queryStringParameters = {}
  url.searchParams.forEach((value, key) => {
    queryStringParameters[key] = value
  })

  const headers = {}
  event.headers.forEach((value, key) => {
    headers[key] = value
  })

  let body = null
  try {
    body = await event.clone().text()
  } catch {
    body = null
  }

  return {
    httpMethod: event.method,
    headers,
    queryStringParameters,
    body,
    raw: event,
  }
}
