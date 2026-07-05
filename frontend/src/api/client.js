import axios from 'axios'

const client = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api' })

client.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.title || err.response?.data || err.message || 'Request failed'
    return Promise.reject(new Error(typeof msg === 'string' ? msg : JSON.stringify(msg)))
  }
)

export default client
