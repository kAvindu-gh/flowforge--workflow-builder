import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Workflows
export const getWorkflows     = ()              => api.get('/workflows/')
export const getWorkflow      = (id)            => api.get(`/workflows/${id}`)
export const createWorkflow   = (data)          => api.post('/workflows/', data)
export const updateWorkflow   = (id, data)      => api.put(`/workflows/${id}`, data)
export const deleteWorkflow   = (id)            => api.delete(`/workflows/${id}`)

// Executions
export const runWorkflow      = (workflowId)    => api.post(`/executions/${workflowId}/run`)
export const getHistory       = (workflowId)    => api.get(`/executions/${workflowId}/history`)

export default api