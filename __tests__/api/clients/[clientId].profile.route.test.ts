import { GET } from '@/app/api/clients/[clientId]/profile/route'
import { connectDB } from '@/lib/db'
import { Client } from '@/lib/models/Client'
import { Order } from '@/lib/models/Order'
import { Sitting } from '@/lib/models/Sitting'
import { Media } from '@/lib/models/Media'
import { ExtraCopy } from '@/lib/models/ExtraCopy'
import { Framing } from '@/lib/models/Framing'
import { requirePermission } from '@/lib/rbac/serverGuard'

jest.mock('@/lib/db', () => ({ connectDB: jest.fn() }))
jest.mock('@/lib/models/Client', () => ({
  Client: {
    findById: jest.fn(),
  },
}))
jest.mock('@/lib/models/Order', () => ({
  Order: {
    find: jest.fn(),
  },
}))
jest.mock('@/lib/models/Sitting', () => ({
  Sitting: {
    find: jest.fn(),
  },
}))
jest.mock('@/lib/models/Media', () => ({
  Media: {
    find: jest.fn(),
  },
}))
jest.mock('@/lib/models/ExtraCopy', () => ({
  ExtraCopy: {
    find: jest.fn(),
  },
}))
jest.mock('@/lib/models/Framing', () => ({
  Framing: {
    find: jest.fn(),
  },
}))
jest.mock('@/lib/rbac/serverGuard', () => ({ requirePermission: jest.fn() }))

const connectDBMock = connectDB as jest.Mock
const clientModel = Client as unknown as { findById: jest.Mock }
const orderModel = Order as unknown as { find: jest.Mock }
const sittingModel = Sitting as unknown as { find: jest.Mock }
const mediaModel = Media as unknown as { find: jest.Mock }
const extraCopyModel = ExtraCopy as unknown as { find: jest.Mock }
const framingModel = Framing as unknown as { find: jest.Mock }
const requirePermissionMock = requirePermission as jest.Mock

afterEach(() => {
  jest.clearAllMocks()
})

describe('app/api/clients/[clientId]/profile', () => {
  it('GET returns 404 when client is missing', async () => {
    requirePermissionMock.mockResolvedValue({ ok: true })

    clientModel.findById.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    })

    const res = await GET(new Request('http://localhost/api/clients/abc/profile'), {
      params: Promise.resolve({ clientId: 'abc' }),
    })

    expect(connectDBMock).toHaveBeenCalled()
    expect(res.status).toBe(404)
  })

  it('GET returns client profile with orders and stats', async () => {
    requirePermissionMock.mockResolvedValue({ ok: true })

    clientModel.findById.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({
        id: 'client-1',
        firstName: 'Jane',
        lastName: 'Doe',
        phoneNumber: '0771234567',
      }),
    })

    orderModel.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        {
          orderId: 'ORD-0001',
          name: 'Jane Doe',
          phone: '0771234567',
          total: 100,
          status: 'completed',
        },
        {
          orderId: 'ORD-0002',
          name: 'Jane Doe',
          phone: '0771234567',
          total: 200,
          status: 'pending',
        },
      ]),
    })

    sittingModel.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([{ item: 'Studio', amount: '50' }]),
    })
    mediaModel.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    })
    extraCopyModel.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([{ item: 'Extra', amount: '10' }]),
    })
    framingModel.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    })

    const res = await GET(new Request('http://localhost/api/clients/abc/profile'), {
      params: Promise.resolve({ clientId: 'abc' }),
    })

    expect(connectDBMock).toHaveBeenCalled()
    expect(res.status).toBe(200)

    const data = await res.json()

    expect(data).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          client: expect.objectContaining({
            firstName: 'Jane',
            lastName: 'Doe',
          }),
          stats: expect.objectContaining({
            totalOrders: 2,
            totalSpent: 300,
            completedOrders: 1,
            pendingOrders: 1,
          }),
        }),
      })
    )
  })
})
