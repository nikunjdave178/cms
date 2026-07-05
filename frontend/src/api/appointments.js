import client from './client'

export const getAppointments = (params) =>
  client.get('/appointments', { params }).then(r => r.data)

export const getAppointment = (id) =>
  client.get(`/appointments/${id}`).then(r => r.data)

export const createAppointment = (data) =>
  client.post('/appointments', data).then(r => r.data)

export const updateAppointment = (id, data) =>
  client.put(`/appointments/${id}`, data).then(r => r.data)

export const getAppointmentVitals = (appointmentId) =>
  client.get(`/appointments/${appointmentId}/vitals`).then(r => r.data)

export const createVitals = (appointmentId, data) =>
  client.post(`/appointments/${appointmentId}/vitals`, data).then(r => r.data)

export const updateVitals = (appointmentId, data) =>
  client.put(`/appointments/${appointmentId}/vitals`, data).then(r => r.data)

export const deleteAppointment = (id) =>
  client.delete(`/appointments/${id}`)
