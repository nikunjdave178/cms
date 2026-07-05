import client from './client'

export const getRevenue = (months = 6) =>
  client.get('/reports/revenue', { params: { months } }).then(r => r.data)

export const getAppointmentsByStatus = () =>
  client.get('/reports/appointments-by-status').then(r => r.data)

export const getPatientGrowth = (months = 6) =>
  client.get('/reports/patient-growth', { params: { months } }).then(r => r.data)

export const getPaymentModes = () =>
  client.get('/reports/payment-modes').then(r => r.data)
