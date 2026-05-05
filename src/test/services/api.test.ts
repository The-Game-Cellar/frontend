import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../server'
import api from '../../services/api'

const API = 'http://api.test'

describe('api axios instance', () => {
  it('targets the configured gateway base URL', () => {
    expect(api.defaults.baseURL).toBe(API)
    expect(api.defaults.withCredentials).toBe(true)
  })

  it('retries the original request after a successful refresh on 401', async () => {
    let firstCall = true
    server.use(
      http.get(`${API}/api/v1/library/games`, () => {
        if (firstCall) {
          firstCall = false
          return new HttpResponse(null, { status: 401 })
        }
        return HttpResponse.json([{ id: 1 }])
      }),
      http.post(`${API}/api/v1/auth/refresh`, () => HttpResponse.json({ ok: true })),
    )

    const res = await api.get('/api/v1/library/games')
    expect(res.status).toBe(200)
    expect(res.data).toEqual([{ id: 1 }])
  })

  it('rejects when the refresh call itself fails', async () => {
    server.use(
      http.get(`${API}/api/v1/library/games`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${API}/api/v1/auth/refresh`, () => new HttpResponse(null, { status: 401 })),
    )

    await expect(api.get('/api/v1/library/games')).rejects.toThrow()
  })
})
