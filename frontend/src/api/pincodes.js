import client from './client'

export const lookupPincodeApi = (pin) =>
  client.get(`/pincodes/${pin}`).then(r => r.data)

export const suggestPincodes = (prefix, limit = 10) =>
  client.get('/pincodes', { params: { prefix, limit } }).then(r => r.data)
