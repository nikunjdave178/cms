import axios from 'axios'

export const AUTH_STORAGE_KEY = 'cms_auth'

// indexes: null makes array params serialize as repeated keys (genderIds=1&genderIds=2)
// instead of axios's default bracket-indexed form (genderIds[0]=1&genderIds[1]=2), which
// ASP.NET Core's query-string model binder for int[]/List<int> parameters doesn't understand.
const client = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api', paramsSerializer: { indexes: null } })

client.interceptors.request.use(config => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY)
  if (raw) {
    const { token } = JSON.parse(raw)
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401 && localStorage.getItem(AUTH_STORAGE_KEY)) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      window.dispatchEvent(new Event('cms:unauthorized'))
    }
    let data = err.response?.data
    // Blob-response requests (e.g. file export) get their error body back as a
    // Blob too — unwrap JSON error bodies so the messages below still work.
    if (data instanceof Blob && data.type?.includes('json')) {
      data = JSON.parse(await data.text())
    }
    // ASP.NET ValidationProblem: surface per-field errors so forms can highlight them.
    if (data?.errors && typeof data.errors === 'object') {
      const flat = Object.values(data.errors).flat().join(' ')
      const e = new Error(flat || data.title || 'Validation failed')
      e.fields = data.errors
      return Promise.reject(e)
    }
    const msg = data?.title || data || err.message || 'Request failed'
    return Promise.reject(new Error(typeof msg === 'string' ? msg : JSON.stringify(msg)))
  }
)

export default client
