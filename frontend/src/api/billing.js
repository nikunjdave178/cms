import client from './client'

export const getInvoices = (params) =>
  client.get('/billing', { params }).then(r => r.data)

export const getInvoice = (id) =>
  client.get(`/billing/${id}`).then(r => r.data)

export const createInvoice = (data) =>
  client.post('/billing', data).then(r => r.data)

export const updateInvoiceStatus = (id, statusId, paymentModeId, paymentReference) =>
  client.patch(`/billing/${id}/status`, { statusId, paymentModeId, paymentReference }).then(r => r.data)

export const deleteInvoice = (id) =>
  client.delete(`/billing/${id}`)

export const getBillingSummary = () =>
  client.get('/billing/summary').then(r => r.data)
