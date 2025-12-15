import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  login: (credentials) => axios.post(`${API_BASE_URL}/auth.php`, credentials),
  register: (data) => axios.post(`${API_BASE_URL}/auth.php?action=register`, data),
  logout: () => axios.post(`${API_BASE_URL}/auth.php?action=logout`),
  me: () => axios.get(`${API_BASE_URL}/auth.php?action=me`),
};

// Users API
export const usersAPI = {
  getAll: () => axios.get(`${API_BASE_URL}/users.php`),
  getById: (id) => axios.get(`${API_BASE_URL}/users.php?id=${id}`),
  create: (data) => axios.post(`${API_BASE_URL}/users.php`, data),
  update: (id, data) => axios.put(`${API_BASE_URL}/users.php?id=${id}`, data),
  delete: (id) => axios.delete(`${API_BASE_URL}/users.php?id=${id}`),
};

// Students API
export const studentsAPI = {
  getAll: (params) => axios.get(`${API_BASE_URL}/students.php`, { params }),
  getById: (id) => axios.get(`${API_BASE_URL}/students.php?id=${id}`),
  create: (data) => axios.post(`${API_BASE_URL}/students.php`, data),
  update: (id, data) => axios.put(`${API_BASE_URL}/students.php?id=${id}`, data),
  delete: (id) => axios.delete(`${API_BASE_URL}/students.php?id=${id}`),
  uploadPhoto: (formData) => axios.post(`${API_BASE_URL}/upload_photo.php`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// Applications API
export const applicationsAPI = {
  getAll: (params) => axios.get(`${API_BASE_URL}/applications.php`, { params }),
  getById: (id) => axios.get(`${API_BASE_URL}/applications.php?id=${id}`),
  create: (data) => axios.post(`${API_BASE_URL}/applications.php`, data),
  approve: (id, data) => axios.post(`${API_BASE_URL}/applications.php?id=${id}&action=approve`, data),
  reject: (id, data) => axios.post(`${API_BASE_URL}/applications.php?id=${id}&action=reject`, data),
};

// Classes API
export const classesAPI = {
  getAll: (params) => axios.get(`${API_BASE_URL}/classes.php`, { params }),
  getById: (id) => axios.get(`${API_BASE_URL}/classes.php?id=${id}`),
  create: (data) => axios.post(`${API_BASE_URL}/classes.php`, data),
  update: (id, data) => axios.put(`${API_BASE_URL}/classes.php?id=${id}`, data),
  delete: (id) => axios.delete(`${API_BASE_URL}/classes.php?id=${id}`),
};

// Subjects API
export const subjectsAPI = {
  getAll: () => axios.get(`${API_BASE_URL}/subjects.php`),
  getById: (id) => axios.get(`${API_BASE_URL}/subjects.php?id=${id}`),
  create: (data) => axios.post(`${API_BASE_URL}/subjects.php`, data),
  update: (id, data) => axios.put(`${API_BASE_URL}/subjects.php?id=${id}`, data),
  delete: (id) => axios.delete(`${API_BASE_URL}/subjects.php?id=${id}`),
};

// Terms API
export const termsAPI = {
  getAll: () => axios.get(`${API_BASE_URL}/terms.php`),
  getById: (id) => axios.get(`${API_BASE_URL}/terms.php?id=${id}`),
  create: (data) => axios.post(`${API_BASE_URL}/terms.php`, data),
  update: (id, data) => axios.put(`${API_BASE_URL}/terms.php?id=${id}`, data),
  delete: (id) => axios.delete(`${API_BASE_URL}/terms.php?id=${id}`),
  activate: (id) => axios.post(`${API_BASE_URL}/terms.php?id=${id}&action=activate`),
};

// Teachers API
export const teachersAPI = {
  getAll: () => axios.get(`${API_BASE_URL}/teachers.php`),
  getById: (id) => axios.get(`${API_BASE_URL}/teachers.php?id=${id}`),
  create: (data) => axios.post(`${API_BASE_URL}/teachers.php`, data),
  update: (id, data) => axios.put(`${API_BASE_URL}/teachers.php?id=${id}`, data),
  delete: (id) => axios.delete(`${API_BASE_URL}/teachers.php?id=${id}`),
};

// Fee Groups API
export const feeGroupsAPI = {
  getAll: () => axios.get(`${API_BASE_URL}/fee_groups.php`),
  getById: (id) => axios.get(`${API_BASE_URL}/fee_groups.php?id=${id}`),
  create: (data) => axios.post(`${API_BASE_URL}/fee_groups.php`, data),
  update: (id, data) => axios.put(`${API_BASE_URL}/fee_groups.php?id=${id}`, data),
  delete: (id) => axios.delete(`${API_BASE_URL}/fee_groups.php?id=${id}`),
};

// Fee Items API
export const feeItemsAPI = {
  getAll: () => axios.get(`${API_BASE_URL}/fee_items.php`),
  getById: (id) => axios.get(`${API_BASE_URL}/fee_items.php?id=${id}`),
  create: (data) => axios.post(`${API_BASE_URL}/fee_items.php`, data),
  update: (id, data) => axios.put(`${API_BASE_URL}/fee_items.php?id=${id}`, data),
  delete: (id) => axios.delete(`${API_BASE_URL}/fee_items.php?id=${id}`),
};

// Finance API (Fee Rules, Installment Plans, Invoices, Payments)
export const financeAPI = {
  // Dashboard
  getDashboardStats: () => axios.get(`${API_BASE_URL}/finance.php?resource=dashboard`),
  
  // Fee Rules
  getFeeRules: () => axios.get(`${API_BASE_URL}/finance.php?resource=fee_rules`),
  getFeeRuleById: (id) => axios.get(`${API_BASE_URL}/finance.php?resource=fee_rules&id=${id}`),
  createFeeRule: (data) => axios.post(`${API_BASE_URL}/finance.php?resource=fee_rules`, data),
  updateFeeRule: (id, data) => axios.put(`${API_BASE_URL}/finance.php?resource=fee_rules&id=${id}`, data),
  deleteFeeRule: (id) => axios.delete(`${API_BASE_URL}/finance.php?resource=fee_rules&id=${id}`),
  
  // Installment Plans
  getInstallmentPlans: () => axios.get(`${API_BASE_URL}/finance.php?resource=installment_plans`),
  getInstallmentPlanById: (id) => axios.get(`${API_BASE_URL}/finance.php?resource=installment_plans&id=${id}`),
  createInstallmentPlan: (data) => axios.post(`${API_BASE_URL}/finance.php?resource=installment_plans`, data),
  updateInstallmentPlan: (id, data) => axios.put(`${API_BASE_URL}/finance.php?resource=installment_plans&id=${id}`, data),
  deleteInstallmentPlan: (id) => axios.delete(`${API_BASE_URL}/finance.php?resource=installment_plans&id=${id}`),
  
  // Invoices
  getInvoices: (params) => axios.get(`${API_BASE_URL}/finance.php?resource=invoices`, { params }),
  getInvoiceById: (id) => axios.get(`${API_BASE_URL}/finance.php?resource=invoices&id=${id}`),
  getInvoiceStats: () => axios.get(`${API_BASE_URL}/finance.php?resource=invoices&action=stats`),
  createInvoice: (data) => axios.post(`${API_BASE_URL}/finance.php?resource=invoices`, data),
  approveInvoice: (id, data) => axios.post(`${API_BASE_URL}/finance.php?resource=invoices&id=${id}&action=approve`, data),
  rejectInvoice: (id, data) => axios.post(`${API_BASE_URL}/finance.php?resource=invoices&id=${id}&action=reject`, data),
  
  // Payments
  getPayments: () => axios.get(`${API_BASE_URL}/finance.php?resource=payments`),
  getPaymentById: (id) => axios.get(`${API_BASE_URL}/finance.php?resource=payments&id=${id}`),
  createPayment: (data) => axios.post(`${API_BASE_URL}/finance.php?resource=payments`, data),
};
