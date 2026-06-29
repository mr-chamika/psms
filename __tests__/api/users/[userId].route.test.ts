import { PATCH, DELETE } from '@/app/api/users/[userId]/route'
import { connectDB } from '@/lib/db'
import { User } from '@/lib/models/User'
import { requirePermission } from '@/lib/rbac/serverGuard'

jest.mock('@/lib/db', () => ({ connectDB: jest.fn() }))
jest.mock('@/lib/models/User', () => ({
  User: {
    findById: jest.fn(),
    findOne: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}))
jest.mock('@/lib/rbac/serverGuard', () => ({ requirePermission: jest.fn() }))

const connectDBMock = connectDB as jest.Mock
const userModel = User as unknown as {
  findById: jest.Mock
  findOne: jest.Mock
  findByIdAndDelete: jest.Mock
}
const requirePermissionMock = requirePermission as jest.Mock

afterEach(() => {
  jest.clearAllMocks()
})

describe('app/api/users/[userId]', () => {
  it('PATCH rejects non-json content type', async () => {
    requirePermissionMock.mockResolvedValue({
      ok: true,
      session: { sub: '1', role: 'admin', email: 'admin@example.com' },
    })

    const req = new Request('http://localhost/api/users/abc', {
      method: 'PATCH',
      headers: { 'content-type': 'text/plain' },
      body: 'plain',
    })

    const res = await PATCH(req, { params: Promise.resolve({ userId: 'abc' }) })

    expect(res.status).toBe(415)
  })

  it('PATCH updates a user', async () => {
    requirePermissionMock.mockResolvedValue({
      ok: true,
      session: { sub: '1', role: 'admin', email: 'admin@example.com' },
    })

    const user = {
      _id: 'abc',
      firstName: 'Old',
      lastName: 'Name',
      email: 'old@example.com',
      role: 'editor',
      phoneNumber: '0771234567',
      save: jest.fn().mockResolvedValue(undefined),
    }

    userModel.findById.mockResolvedValue(user)
    userModel.findOne.mockResolvedValue(null)

    const req = new Request('http://localhost/api/users/abc', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        firstName: 'New',
        lastName: 'User',
        email: 'new@example.com',
        role: 'admin',
        phoneNumber: '0771234567',
      }),
    })

    const res = await PATCH(req, { params: Promise.resolve({ userId: 'abc' }) })

    expect(connectDBMock).toHaveBeenCalled()
    expect(res.status).toBe(200)
    expect(user.save).toHaveBeenCalled()
  })

  it('DELETE returns 404 when user is missing', async () => {
    requirePermissionMock.mockResolvedValue({
      ok: true,
      session: { sub: '1', role: 'admin', email: 'admin@example.com' },
    })

    userModel.findByIdAndDelete.mockResolvedValue(null)

    const res = await DELETE(new Request('http://localhost/api/users/abc'), {
      params: Promise.resolve({ userId: 'abc' }),
    })

    expect(connectDBMock).toHaveBeenCalled()
    expect(res.status).toBe(404)
  })
})
