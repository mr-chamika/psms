import { POST, PATCH, DELETE } from '@/app/api/clients/[clientId]/route'
import { connectDB } from '@/lib/db'
import { Client } from '@/lib/models/Client'
import { requirePermission } from '@/lib/rbac/serverGuard'

jest.mock('@/lib/db', () => ({ connectDB: jest.fn() }))
jest.mock('@/lib/models/Client', () => ({
  Client: {
    findById: jest.fn(),
    findOne: jest.fn(),
  },
}))
jest.mock('@/lib/rbac/serverGuard', () => ({ requirePermission: jest.fn() }))

const connectDBMock = connectDB as jest.Mock
const clientModel = Client as unknown as {
  findById: jest.Mock
  findOne: jest.Mock
}
const requirePermissionMock = requirePermission as jest.Mock

afterEach(() => {
  jest.clearAllMocks()
})

describe('app/api/clients/[clientId]', () => {
  it('POST returns 404 when client is missing', async () => {
    requirePermissionMock.mockResolvedValue({ ok: true })

    clientModel.findById.mockReturnValue({
      setOptions: jest.fn().mockResolvedValue(null),
    })

    const res = await POST(new Request('http://localhost/api/clients/abc'), {
      params: Promise.resolve({ clientId: 'abc' }),
    })

    expect(connectDBMock).toHaveBeenCalled()
    expect(res.status).toBe(404)
  })

  it('POST returns 400 when client is not deleted', async () => {
    requirePermissionMock.mockResolvedValue({ ok: true })

    clientModel.findById.mockReturnValue({
      setOptions: jest.fn().mockResolvedValue({ is_deleted: false }),
    })

    const res = await POST(new Request('http://localhost/api/clients/abc'), {
      params: Promise.resolve({ clientId: 'abc' }),
    })

    expect(res.status).toBe(400)
  })

  it('POST restores a deleted client', async () => {
    requirePermissionMock.mockResolvedValue({ ok: true })

    const restore = jest.fn().mockResolvedValue(undefined)

    clientModel.findById.mockReturnValue({
      setOptions: jest.fn().mockResolvedValue({ is_deleted: true, restore }),
    })

    const res = await POST(new Request('http://localhost/api/clients/abc'), {
      params: Promise.resolve({ clientId: 'abc' }),
    })

    expect(restore).toHaveBeenCalled()
    expect(res.status).toBe(200)
  })

  it('PATCH rejects non-json content type', async () => {
    requirePermissionMock.mockResolvedValue({ ok: true })

    const req = new Request('http://localhost/api/clients/abc', {
      method: 'PATCH',
      headers: { 'content-type': 'text/plain' },
      body: 'plain',
    })

    const res = await PATCH(req, { params: Promise.resolve({ clientId: 'abc' }) })

    expect(res.status).toBe(415)
  })

  it('PATCH returns conflict when phone is used', async () => {
    requirePermissionMock.mockResolvedValue({ ok: true })

    clientModel.findById.mockResolvedValue({
      _id: 'abc',
      firstName: 'Old',
      lastName: 'Name',
      phoneNumber: '0771234567',
      save: jest.fn().mockResolvedValue(undefined),
    })

    clientModel.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: 'other' }),
    })

    const req = new Request('http://localhost/api/clients/abc', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        firstName: 'New',
        lastName: 'Name',
        phoneNumber: '077-123 4567',
      }),
    })

    const res = await PATCH(req, { params: Promise.resolve({ clientId: 'abc' }) })

    expect(res.status).toBe(409)
  })

  it('DELETE soft deletes a client', async () => {
    requirePermissionMock.mockResolvedValue({ ok: true })

    const softDelete = jest.fn().mockResolvedValue(undefined)
    const clientDoc = {
      _id: 'abc',
      softDelete,
      model: jest.fn().mockReturnValue({
        countDocuments: jest.fn().mockReturnThis(),
        setOptions: jest.fn().mockResolvedValue(2),
      }),
    }

    clientModel.findById.mockReturnValue({
      setOptions: jest.fn().mockResolvedValue(clientDoc),
    })

    const res = await DELETE(new Request('http://localhost/api/clients/abc'), {
      params: Promise.resolve({ clientId: 'abc' }),
    })

    expect(softDelete).toHaveBeenCalled()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(
      expect.objectContaining({
        message: 'Client soft deleted successfully.',
        orderCount: 2,
      })
    )
  })
})
