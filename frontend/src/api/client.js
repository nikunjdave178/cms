import axios from 'axios'

export const AUTH_STORAGE_KEY = 'cms_auth'

const client = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api' })

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
  err => {
    if (err.response?.status === 401 && localStorage.getItem(AUTH_STORAGE_KEY)) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      window.dispatchEvent(new Event('cms:unauthorized'))
    }
    const msg = err.response?.data?.title || err.response?.data || err.message || 'Request failed'
    return Promise.reject(new Error(typeof msg === 'string' ? msg : JSON.stringify(msg)))
  }
)

export default client
