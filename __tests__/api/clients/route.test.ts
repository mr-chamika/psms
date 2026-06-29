import { GET, POST } from '@/app/api/clients/route'
import { connectDB } from '@/lib/db'
import { Client } from '@/lib/models/Client'
import { requirePermission } from '@/lib/rbac/serverGuard'

jest.mock('@/lib/db', () => ({ connectDB: jest.fn() }))
jest.mock('@/lib/models/Client', () => ({
  Client: {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
}))
jest.mock('@/lib/rbac/serverGuard', () => ({ requirePermission: jest.fn() }))

const connectDBMock = connectDB as jest.Mock
const clientModel = Client as unknown as {
  find: jest.Mock
  findOne: jest.Mock
  create: jest.Mock
}
const requirePermissionMock = requirePermission as jest.Mock

afterEach(() => {
  jest.clearAllMocks()
})

describe('app/api/clients', () => {
  it('GET returns clients by phone query', async () => {
    requirePermissionMock.mockResolvedValue({ ok: true })

    clientModel.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ id: '1', phoneNumber: '0771234567' }),
    })

    const req = new Request('http://localhost/api/clients?phone=0771234567')
    const res = await GET(req)

    expect(connectDBMock).toHaveBeenCalled()
    expect(clientModel.findOne).toHaveBeenCalledWith({ phoneNumber: '0771234567' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([{ id: '1', phoneNumber: '0771234567' }])
  })

  it('GET returns deleted clients when deleted=true', async () => {
    requirePermissionMock.mockResolvedValue({ ok: true })

    const query = {
      setOptions: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([{ id: 'del-1' }]),
    }

    clientModel.find.mockReturnValue(query)

    const req = new Request('http://localhost/api/clients?deleted=true')
    const res = await GET(req)

    expect(connectDBMock).toHaveBeenCalled()
    expect(query.setOptions).toHaveBeenCalledWith({ includeDeleted: true })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([{ id: 'del-1' }])
  })

  it('POST rejects non-multipart requests', async () => {
    requirePermissionMock.mockResolvedValue({ ok: true })

    const req = new Request('http://localhost/api/clients', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })

    const res = await POST(req)

    expect(res.status).toBe(415)
  })

  it('POST returns conflict when phone already exists', async () => {
    requirePermissionMock.mockResolvedValue({ ok: true })

    clientModel.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ id: '1', phoneNumber: '0771234567' }),
    })

    const formData = new FormData()
    formData.append('firstName', 'Jane')
    formData.append('lastName', 'Doe')
    formData.append('phoneNumber', '0771234567')

    const req = new Request('http://localhost/api/clients', {
      method: 'POST',
      body: formData,
    })

    const res = await POST(req)

    expect(connectDBMock).toHaveBeenCalled()
    expect(res.status).toBe(409)
  })

  it('POST creates a client', async () => {
    requirePermissionMock.mockResolvedValue({ ok: true })

    clientModel.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    })

    clientModel.create.mockResolvedValue({ id: 'new-client' })

    const formData = new FormData()
    formData.append('firstName', 'Jane')
    formData.append('lastName', 'Doe')
    formData.append('phoneNumber', '0771234567')

    const req = new Request('http://localhost/api/clients', {
      method: 'POST',
      body: formData,
    })

    const res = await POST(req)

    expect(connectDBMock).toHaveBeenCalled()
    expect(clientModel.create).toHaveBeenCalledWith({
      firstName: 'Jane',
      lastName: 'Doe',
      phoneNumber: '0771234567',
    })
    expect(res.status).toBe(201)
  })
})
