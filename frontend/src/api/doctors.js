import client from './client'

export const getDoctors = (params) =>
  client.get('/doctors', { params }).then(r => r.data)

export const getDoctor = (id) =>
  client.get(`/doctors/${id}`).then(r => r.data)

export const createDoctor = (data) =>
  client.post('/doctors', data).then(r => r.data)

export const updateDoctor = (id, data) =>
  client.put(`/doctors/${id}`, data).then(r => r.data)

export const deleteDoctor = (id) =>
  client.delete(`/doctors/${id}`)
