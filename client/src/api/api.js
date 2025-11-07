import axios from 'axios';

const API = axios.create({
  baseURL: `${import.meta.env.VITE_BASE_URI}/quotations`,
});

export const fetchQuotations = (params) => API.get('', { params });
export const fetchQuotation = (id) => API.get(`/${id}`);
export const createQuotation = (data) => API.post('/create', data);
export const updateQuotation = (id, data) => API.put(`/${id}`, data);
export const deleteQuotation = (id) => API.delete(`/${id}`);
export const downloadPDF = (id) => `${API.defaults.baseURL}/${id}/pdf`;