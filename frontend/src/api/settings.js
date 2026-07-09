import client from './client'

export const getNumberSequences = () =>
  client.get('/settings/number-sequences').then(r => r.data)

export const updateNumberSequence = (entityType, data) =>
  client.put(`/settings/number-sequences/${entityType}`, data).then(r => r.data)
