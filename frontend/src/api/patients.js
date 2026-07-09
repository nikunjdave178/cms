import client from './client'

export const getPatients = (params) =>
  client.get('/patients', { params }).then(r => r.data)

export const getPatient = (id) =>
  client.get(`/patients/${id}`).then(r => r.data)

export const createPatient = (data) =>
  client.post('/patients', data).then(r => r.data)

export const updatePatient = (id, data) =>
  client.put(`/patients/${id}`, data).then(r => r.data)

export const deletePatient = (id) =>
  client.delete(`/patients/${id}`)

export const exportPatients = (params, format) =>
  client
    .get('/patients/export', { params: { ...params, format }, responseType: 'blob' })
    .then(r => r.data)
