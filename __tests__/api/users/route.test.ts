import { GET, POST } from '@/app/api/users/route'
import { connectDB } from '@/lib/db'
import { User } from '@/lib/models/User'
import { requirePermission, getAuthSessionFromCookies } from '@/lib/rbac/serverGuard'
import bcrypt from 'bcryptjs'

jest.mock('@/lib/db', () => ({ connectDB: jest.fn() }))
jest.mock('@/lib/models/User', () => ({
  User: {
    find: jest.fn(),
    countDocuments: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
}))
jest.mock('@/lib/rbac/serverGuard', () => ({
  requirePermission: jest.fn(),
  getAuthSessionFromCookies: jest.fn(),
}))
jest.mock('bcryptjs', () => ({ hash: jest.fn() }))

const connectDBMock = connectDB as jest.Mock
const userModel = User as unknown as {
  find: jest.Mock
  countDocuments: jest.Mock
  findOne: jest.Mock
  create: jest.Mock
}
const requirePermissionMock = requirePermission as jest.Mock
const getAuthSessionMock = getAuthSessionFromCookies as jest.Mock
const bcryptHashMock = bcrypt.hash as jest.Mock

afterEach(() => {
  jest.clearAllMocks()
})

describe('app/api/users', () => {
  it('GET returns users list', async () => {
    requirePermissionMock.mockResolvedValue({
      ok: true,
      session: { sub: '1', role: 'admin', email: 'admin@example.com' },
    })

    const query = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([{ id: '1', email: 'admin@example.com' }]),
    }

    userModel.find.mockReturnValue(query)

    const res = await GET()

    expect(connectDBMock).toHaveBeenCalled()
    expect(query.select).toHaveBeenCalledWith('-password')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([{ id: '1', email: 'admin@example.com' }])
  })

  it('POST rejects non-json content type', async () => {
    const req = new Request('http://localhost/api/users', {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: 'plain',
    })

    const res = await POST(req)

    expect(res.status).toBe(415)
  })

  it('POST allows first admin bootstrap without session', async () => {
    getAuthSessionMock.mockResolvedValue(null)
    userModel.countDocuments.mockResolvedValue(0)
    userModel.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) })
    bcryptHashMock.mockResolvedValue('hashed-password')

    const req = new Request('http://localhost/api/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Admin',
        lastName: 'User',
        phoneNumber: '0771234567',
        role: 'admin',
        email: 'Admin@Example.com',
        password: 'StrongPass123',
      }),
    })

    const res = await POST(req)

    expect(connectDBMock).toHaveBeenCalled()
    expect(res.status).toBe(201)
    expect(userModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'admin@example.com',
        password: 'hashed-password',
      })
    )
  })
})
