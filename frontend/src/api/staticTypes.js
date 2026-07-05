import client from './client'

export const getAllStaticTypes = () =>
  client.get('/static-types').then(r => r.data)

export const getStaticValues = (typeCode) =>
  client.get(`/static-types/${typeCode}/values`).then(r => r.data)
