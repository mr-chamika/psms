import { PATCH } from '@/app/api/users/me/route'
import { connectDB } from '@/lib/db'
import { User } from '@/lib/models/User'
import { requireAuth } from '@/lib/rbac/serverGuard'

jest.mock('@/lib/auth', () => ({ AUTH_COOKIE_NAME: 'auth_token' }))

import { AUTH_COOKIE_NAME } from '@/lib/auth'

jest.mock('@/lib/db', () => ({ connectDB: jest.fn() }))
jest.mock('@/lib/models/User', () => ({
  User: {
    findById: jest.fn(),
    findOne: jest.fn(),
  },
}))
jest.mock('@/lib/rbac/serverGuard', () => ({ requireAuth: jest.fn() }))

const connectDBMock = connectDB as jest.Mock
const userModel = User as unknown as {
  findById: jest.Mock
  findOne: jest.Mock
}
const requireAuthMock = requireAuth as jest.Mock

afterEach(() => {
  jest.clearAllMocks()
  delete process.env.JWT_SECRET
  delete process.env.JWT_EXPIRES_IN
})

describe('app/api/users/me', () => {
  it('PATCH returns unauthorized when session is missing', async () => {
    requireAuthMock.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 }),
    })

    const req = new Request('http://localhost/api/users/me', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })

    const res = await PATCH(req)

    expect(res.status).toBe(401)
  })

  it('PATCH updates profile and refreshes auth cookie', async () => {
    process.env.JWT_SECRET = 'test-secret'

    requireAuthMock.mockResolvedValue({
      ok: true,
      session: { sub: 'user-1', role: 'admin', email: 'old@example.com' },
    })

    const user = {
      _id: 'user-1',
      firstName: 'Old',
      lastName: 'Name',
      email: 'old@example.com',
      phoneNumber: '0771234567',
      role: 'admin',
      save: jest.fn().mockResolvedValue(undefined),
    }

    userModel.findById.mockResolvedValue(user)
    userModel.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)

    const req = new Request('http://localhost/api/users/me', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        firstName: 'New',
        lastName: 'Name',
        email: 'new@example.com',
        phoneNumber: '0771234567',
      }),
    })

    const res = await PATCH(req)

    expect(connectDBMock).toHaveBeenCalled()
    expect(res.status).toBe(200)
    expect(user.save).toHaveBeenCalled()

    const data = await res.json()
    expect(data).toEqual(
      expect.objectContaining({
        message: 'Profile updated successfully.',
        user: expect.objectContaining({
          id: 'user-1',
          email: 'new@example.com',
        }),
      })
    )

    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).toContain(AUTH_COOKIE_NAME)
  })
})
