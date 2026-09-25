import api from './client';

// Auth APIs
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  providerApply: (data) => {
    if (typeof FormData !== 'undefined' && data instanceof FormData) {
      return api.post('/auth/provider-apply', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post('/auth/provider-apply', data);
  },
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// User APIs
export const userApi = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  updateProfile: (formData) =>
    api.put('/users/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateStatus: (id, status) => api.put(`/users/${id}/status`, { status }),
  createStaff: (data) => api.post('/users/create-staff', data),
  delete: (id) => api.delete(`/users/${id}`),
};

// Provider APIs
export const providerApi = {
  getAll: (params) => api.get('/providers', { params }),
  getById: (id) => api.get(`/providers/${id}`),
  getMe: () => api.get('/providers/me'),
  getApplications: (params) => api.get('/providers/applications', { params }),
  updateProfile: (formData) =>
    api.put('/providers/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadDocuments: (formData) =>
    api.post('/providers/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  verify: (id, data) => api.put(`/providers/${id}/verify`, data),
};

// Category APIs
export const categoryApi = {
  getAll: (params) => api.get('/categories', { params }),
  getById: (idOrSlug) => api.get(`/categories/${idOrSlug}`),
  create: (formData) =>
    api.post('/categories', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id, formData) =>
    api.put(`/categories/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updatePricing: (id, data) => api.put(`/categories/${id}/pricing`, data),
  delete: (id, hardDelete = false) => api.delete(`/categories/${id}?hardDelete=${hardDelete}`),
};

// Service Request APIs
export const serviceRequestApi = {
  create: (formData) =>
    api.post('/service-requests', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getAll: (params) => api.get('/service-requests', { params }),
  getById: (id) => api.get(`/service-requests/${id}`),
  cancel: (id, reason) => api.put(`/service-requests/${id}/cancel`, { reason }),
  classify: (data) => api.post('/service-requests/classify', data),
};

// Quote APIs
export const quoteApi = {
  submit: (data) => api.post('/quotes', data),
  generateInstant: (data) => api.post('/quotes/generate-instant', data),
  getForRequest: (requestId) => api.get(`/quotes/request/${requestId}`),
  getMyQuotes: () => api.get('/quotes/my-quotes'),
  update: (id, data) => api.put(`/quotes/${id}`, data),
  withdraw: (id) => api.delete(`/quotes/${id}`),
};

// Booking APIs
export const bookingApi = {
  create: (data) => api.post('/bookings', data),
  getAll: (params) => api.get('/bookings', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  updateStatus: (id, data) => api.put(`/bookings/${id}/status`, data),
  confirmCompletion: (id) => api.put(`/bookings/${id}/confirm`),
  requestCancellation: (id, reason) => api.post(`/bookings/${id}/cancel-request`, { reason }),
  uploadEvidence: (id, formData) =>
    api.post(`/bookings/${id}/evidence`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Availability APIs
export const availabilityApi = {
  set: (data) => api.post('/availability', data),
  getForProvider: (providerId, params) => api.get(`/availability/provider/${providerId}`, { params }),
  getMy: (params) => api.get('/availability/me', { params }),
  check: (data) => api.post('/availability/check', data),
};

// Invoice APIs
export const invoiceApi = {
  getOrCreate: (bookingId) => api.post(`/invoices/booking/${bookingId}`),
  getByBooking: (bookingId) => api.post(`/invoices/booking/${bookingId}`),
  getById: (id) => api.get(`/invoices/${id}`),
  getMy: () => api.get('/invoices'),
};

// Review APIs
export const reviewApi = {
  submit: (data) => api.post('/reviews', data),
  create: (data) => api.post('/reviews', data),
  getByBooking: (bookingId) => api.get(`/reviews/booking/${bookingId}`),
  getForProvider: (providerId) => api.get(`/reviews/provider/${providerId}`),
  respond: (id, text) => api.put(`/reviews/${id}/respond`, { text }),
};

// Dispute APIs
export const disputeApi = {
  raise: (formData) =>
    api.post('/disputes', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  create: (data) =>
    typeof FormData !== 'undefined' && data instanceof FormData
      ? api.post('/disputes', data, { headers: { 'Content-Type': 'multipart/form-data' } })
      : api.post('/disputes', data),
  getAll: (params) => api.get('/disputes', { params }),
  getById: (id) => api.get(`/disputes/${id}`),
  update: (id, data) => api.put(`/disputes/${id}`, data),
  resolve: (id, data) => api.put(`/disputes/${id}`, data),
  respond: (id, formData) =>
    api.put(`/disputes/${id}/respond`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// Notification APIs
export const notificationApi = {
  getAll: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// Operations APIs
export const operationsApi = {
  getBookings: (params) => api.get('/operations/bookings', { params }),
  assignProvider: (bookingId, data) => api.put(`/operations/bookings/${bookingId}/assign`, data),
  handleCancellation: (bookingId, data) => api.put(`/operations/bookings/${bookingId}/cancellation`, data),
  getCancellations: () => api.get('/operations/cancellations'),
};

// Analytics APIs
export const analyticsApi = {
  get: () => api.get('/analytics'),
  getAuditLogs: (params) => api.get('/analytics/audit', { params }),
};

// AI APIs
export const aiApi = {
  chat: (message, context) => api.post('/ai/chat', { message, context }),
  classify: (description, categoryName) => api.post('/ai/classify', { description, categoryName }),
  matchProviders: (requestId) => api.get(`/ai/match/${requestId}`),
};
