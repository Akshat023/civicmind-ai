import axios from 'axios'

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
})

export const reportIssue = async (formData: FormData) => {
  const res = await API.post('/api/report', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export const getIssues = async (status?: string, category?: string) => {
  const params: Record<string, string> = {}
  if (status) params.status = status
  if (category) params.category = category
  const res = await API.get('/api/issues', { params })
  return res.data
}

export const getIssue = async (id: string) => {
  const res = await API.get(`/api/issues/${id}`)
  return res.data
}

export const updateStatus = async (id: string, status: string) => {
  const res = await API.put(`/api/issues/${id}/status`, { status })
  return res.data
}

export const voteOnIssue = async (id: string) => {
  const res = await API.post(`/api/issues/${id}/vote`)
  return res.data
}

export const citizenChat = async (message: string, issueId?: string) => {
  const res = await API.post('/api/chat', { message, issue_id: issueId })
  return res.data
}

export const mayorQuery = async (query: string) => {
  const res = await API.post('/api/mayor/query', { query })
  return res.data
}

export const getDashboardStats = async () => {
  const res = await API.get('/api/dashboard/stats')
  return res.data
}